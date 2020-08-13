import ts from 'typescript';
import { CompDefinition, isJsxExpression, asCode, getNodeSrc, asAst, setNodeSrc, cloneDeep, findUsedVariables, JsxExpression } from '@tsx-air/compiler-utils';
import { safely } from '@tsx-air/utils';
import { getDirectExpressions, getRecursiveMapPaths } from '../helpers';
import { toCanonicalString } from '../fragment/common';
import { chain } from 'lodash';
import { findJsxComp } from '../fragment/virtual.comp';
import { readNodeFuncName } from './names';
import { CompScriptTransformCtx } from '.';

export function swapVirtualElements(ctx:CompScriptTransformCtx, n: ts.Node, allowNonFrags = false): ts.Expression | undefined {
    const {comp, fragments} = ctx;
    if (ts.isParenthesizedExpression(n)) {
        return swapVirtualElements(ctx, n.expression);
    }
    if (ts.isJsxElement(n) || ts.isJsxSelfClosingElement(n)) {
        const frag = safely(
            () => fragments.find(f => f.root.sourceAstNode === getNodeSrc(n)),
            `Unidentified Fragment Instance`, f => allowNonFrags || f)!;
        if (!frag || frag.isComponent) {
            const [i, c] = findJsxComp(comp, n);
            if (c) {
                const ret = asAst(`this.$${c.name}${i}`) as ts.Expression;
                return setNodeSrc(ret, n);
            }
        } else {
            const propsMap = new Map<string, string>();
            getDirectExpressions(frag.root)
                .forEach(e => propsMap.set(e.expression, toFragSafe(ctx, e)));
            frag.root.components.forEach(c =>
                c.props.forEach(({ value }) => {
                    if (isJsxExpression(value)) {
                        propsMap.set(value.expression, toFragSafe(ctx, value));
                    }
                })
            );
            const p = `{${[...propsMap.entries()].map(([k, v]) =>
                `${toCanonicalString(k)}:${v}`
            ).join(',')}}`;

            const ret = asAst(`VirtualElement.fragment('${frag.index}', ${comp.name}.${frag.id}, this, ${p})`) as ts.Expression;
            return setNodeSrc(ret, n);
        }
    }
    return undefined;
}

export function swapVarDeclarations({ comp, declaredVars }: CompScriptTransformCtx, n: ts.Node) {
    if (ts.isVariableStatement(n)) {
        const declarations = chain(n.declarationList.declarations)
            .filter(declaration => !isFunc(declaration))
            .map(declaration => {
                if (declaration.initializer) {
                    return enrichStoreDeclaration(comp, declaration);
                }
                return declaration;
            })
            .flatMap(declaration => {
                if (ts.isObjectBindingPattern(declaration.name)) {
                    const bound = declaration.name.elements.filter(e => asCode(e.name) in comp.aggregatedVariables.accessed);
                    bound.forEach(b => declaredVars.add(asCode(b.name)));
                    return bound.length
                        ? ts.createVariableDeclaration(
                            ts.createObjectBindingPattern(bound), undefined,
                            declaration.initializer
                                ? declaration.initializer
                                : undefined
                        )
                        : [];
                } else if (asCode(declaration.name) in comp.aggregatedVariables.accessed) {
                    declaredVars.add(asCode(declaration.name));
                    return declaration;
                }
                return [];
            }).value();
        return declarations.length
            ? cloneDeep(
                ts.createVariableStatement(undefined, ts.createVariableDeclarationList(
                    declarations, n.declarationList.flags)))
            : ts.createEmptyStatement();
    }
    return undefined;
}

function enrichStoreDeclaration(comp: CompDefinition, declaration: ts.VariableDeclaration): ts.VariableDeclaration {
    if (isStoreDefinition(comp, declaration)) {
        const { name } = declaration;
        if (!name || ts.isObjectBindingPattern(name) || ts.isArrayBindingPattern(name)) {
            throw new Error(`Invalid store declaration: must be assigned to a variable`);
        }
        const store = declaration.initializer as ts.CallExpression;

        return ts.createVariableDeclaration(declaration.name, declaration.type,
            ts.createCall(store.expression, undefined, [store.arguments[0], ts.createThis(), ts.createStringLiteral(asCode(declaration.name))])
        );
    }
    return declaration;
}

function isStoreDefinition(comp: CompDefinition, node: ts.Statement | ts.VariableDeclaration) {
    if (ts.isVariableStatement(node)) {
        const used = findUsedVariables(node);
        return comp.stores.some(store => used.defined[store.name]);
    }
    if (ts.isVariableDeclaration(node)) {
        const name = asCode(node.name);
        return comp.stores.some(store => store.name === name);
    }
    return false;
}

export const enrichLifeCycleApiFunc = (ctx: CompScriptTransformCtx, node: ts.Node) => {
    const lifeCycleFuncsWithFilter = new Set(['when', 'memo', 'afterDomUpdate']);
    const lifeCycleFuncsWithoutFilter = new Set(['afterMount', 'beforeUnmount']);

    if (ts.isExpressionStatement(node) &&
        ts.isCallExpression(node.expression)) {
        const call = node.expression;
        const apiCall = asCode(call.expression);
        if (lifeCycleFuncsWithFilter.has(apiCall) || lifeCycleFuncsWithoutFilter.has(apiCall)) {
            if (ctx.allowLifeCycleApiCalls) {
                const actionIsFirstArg = !!readNodeFuncName(call.arguments[0]);
                const actionName = readNodeFuncName(call.arguments[actionIsFirstArg ? 0 : 1]);
                const params = [`this`, ctx.apiCalls++, `this.${actionName}`,];
                if (lifeCycleFuncsWithFilter.has(apiCall)) {
                    const dependencies = actionIsFirstArg
                        ? `[${
                        getRecursiveMapPaths(findUsedVariables(call.arguments[0]).read)
                            .join(',')}]`
                        : asCode(call.arguments[0]);
                    params.push(dependencies);
                }
                call.arguments.forEach((arg, index) => {
                    // @ts-ignore
                    if (index > (1 & actionIsFirstArg)) {
                        params.push(asCode(arg));
                    }
                });

                return asAst(`${apiCall}(${params.join(',')})`);
            } else {
                throw new Error(`Invalid ${apiCall} call: should only be used component body (i.e. not in functions)`);
            }
        }
    }
    return undefined;
};

export const swapLambdas = (n: ts.Node) => {
    if (ts.isFunctionExpression(n) || ts.isArrowFunction(n)) {
        return ts.createCall(
            ts.createPropertyAccess(
                ts.createThis(),
                ts.createIdentifier(readNodeFuncName(n))
            ),
            undefined,
            []
        );
    }
    return undefined;
};

export const toFragSafe = (ctx:CompScriptTransformCtx, exp: JsxExpression): string =>
    asCode(cloneDeep(exp.sourceAstNode.expression!, undefined, n => swapVirtualElements(ctx, n)) as ts.Expression);


export function handleArrowFunc({ parser }: CompScriptTransformCtx, n: ts.Node, skipArrow?: ts.Node) {
    if (n !== skipArrow && n.parent && ts.isArrowFunction(n.parent)) {
        return ts.createReturn(
            parser(n, n) as any
        );
    }
    return undefined;
}

const isFunc = (v: ts.VariableDeclaration) => (v.initializer && (
    ts.isArrowFunction(v.initializer) ||
    ts.isFunctionExpression(v.initializer)));
