import ts from 'typescript';
import { isJsxExpression, asCode, getNodeSrc, asAst, setNodeSrc, cloneDeep, JsxExpression } from '@tsx-air/compiler-utils';
import { safely } from '@tsx-air/utils';
import { getDirectExpressions } from '../helpers';
import { toCanonicalString } from '../fragment/common';
import { findJsxComp } from '../fragment/virtual.comp';
import { readNodeFuncName } from './names';
import { CompScriptTransformCtx } from '.';
import { chain } from 'lodash';
export { enrichLifeCycleApiFunc } from './lifecycle.api';

export function swapVirtualElements(ctx: CompScriptTransformCtx, n: ts.Node, allowNonFrags = false): ts.Expression | undefined {
    const { code: comp, fragments } = ctx;
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

export function swapVarDeclarations(ctx: CompScriptTransformCtx, n: ts.Node) {
    const { code: comp, declaredVars } = ctx;
    if (ts.isVariableStatement(n)) {
        const declarations = chain(n.declarationList.declarations)
            .filter(declaration => !isFunc(declaration))
            .flatMap(declaration => {
                if (ts.isObjectBindingPattern(declaration.name)) {
                    const usedVolatile = declaration.name.elements.filter(e => asCode(e.name) in comp.aggregatedVariables.accessed);
                    usedVolatile.forEach(b => declaredVars.add(asCode(b.name)));
                    return usedVolatile.length
                        ? ts.createVariableDeclaration(
                            ts.createObjectBindingPattern(usedVolatile), undefined,
                            declaration.initializer
                                ? ctx.parser(declaration.initializer) as any
                                : undefined
                        )
                        : [];
                } else if (asCode(declaration.name) in comp.aggregatedVariables.accessed) {
                    declaredVars.add(asCode(declaration.name));
                    return ctx.parser(declaration) as any as ts.VariableDeclaration;
                }
                return [];
            }).value();
        return declarations.length
            ? ts.createVariableStatement(undefined, ts.createVariableDeclarationList(
                declarations, n.declarationList.flags))
            : ts.createEmptyStatement();
    }
    return undefined;
}

const isFunc = (v: ts.VariableDeclaration) => (v.initializer && (
    ts.isArrowFunction(v.initializer) ||
    ts.isFunctionExpression(v.initializer)));

export const swapLambdas = (_ctx: CompScriptTransformCtx, n: ts.Node) => {
    if (ts.isFunctionExpression(n) || ts.isArrowFunction(n)) {
        const name = readNodeFuncName(n);

        return name ? ts.createCall(
            ts.createPropertyAccess(
                ts.createThis(),
                ts.createIdentifier(name)
            ),
            undefined,
            []
        ) : n;
    }
    return undefined;
};

export const toFragSafe = (ctx: CompScriptTransformCtx, exp: JsxExpression): string =>
    asCode(cloneDeep(exp.sourceAstNode.expression!, undefined, n => swapVirtualElements(ctx, n)) as ts.Expression);


export function handleArrowFunc({ parser }: CompScriptTransformCtx, n: ts.Node, skipArrow?: ts.Node) {
    if (n !== skipArrow && n.parent && ts.isArrowFunction(n.parent)) {
        return ts.createReturn(
            parser(n, n) as any
        );
    }
    return undefined;
}
