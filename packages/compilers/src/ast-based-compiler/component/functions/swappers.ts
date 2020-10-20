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

export type Swapper = (n: ts.Node, ctx: CompScriptTransformCtx, skip?: ts.Node, allowJsx?: boolean) => Generator<ts.Node, void | true>;

export const swapVirtualElements: Swapper = function* (n, ctx, _, allowNonFrags = false) {
    const { code, fragments } = ctx;
    if (ts.isParenthesizedExpression(n)) {
        yield* swapVirtualElements(n.expression, ctx);
    }
    if (ts.isJsxElement(n) || ts.isJsxSelfClosingElement(n)) {
        const frag = safely(
            () => fragments.find(f => f.root.sourceAstNode === getNodeSrc(n)),
            `Unidentified Fragment Instance`, f => allowNonFrags || f)!;
        if (!frag || frag.isComponent) {
            const [i, c] = findJsxComp(code, n);
            if (c) {
                const ret = asAst(`this.$${c.name}${i}`) as ts.Expression;
                yield setNodeSrc(ret, n);
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

            const ret = asAst(`VirtualElement.fragment('${frag.index}', ${code.name}.${frag.id}, this, ${p})`) as ts.Expression;
            yield setNodeSrc(ret, n);
        }
    }
};

const addToVolatile = ({ name }: any) =>
    name && ts.isIdentifier(name)
        ? asAst(`this.volatile['${asCode(name)}'] = ${asCode(name)}`)
        : ts.createEmptyStatement();

export const swapVarDeclarations: Swapper = function* (n, ctx) {
    const { code, declaredVars } = ctx;
    if (ts.isVariableStatement(n)) {
        const declarations = chain(n.declarationList.declarations)
            .filter(declaration => !ctx.isMainUserCode || !isFunc(declaration))
            .flatMap(declaration => {
                if (ts.isObjectBindingPattern(declaration.name)) {
                    const usedVolatile = declaration.name.elements.filter(e => asCode(e.name) in code.aggregatedVariables.accessed);
                    usedVolatile.forEach(b => declaredVars.add(asCode(b.name)));
                    return usedVolatile.length
                        ? ts.createVariableDeclaration(
                            ts.createObjectBindingPattern(usedVolatile), undefined,
                            declaration.initializer
                                ? ctx.parser(declaration.initializer).next().value as any
                                : undefined
                        )
                        : [];
                } else if (asCode(declaration.name) in code.aggregatedVariables.accessed) {
                    declaredVars.add(asCode(declaration.name));
                    return ctx.parser(declaration).next().value as any as ts.VariableDeclaration;
                }
                return [];
            }).value();
        if (declarations.length) {
            yield ts.createVariableStatement(undefined, ts.createVariableDeclarationList(
                declarations, n.declarationList.flags));
            if (ctx.isMainUserCode) {
                for (const dec of declarations) {
                    if (ts.isIdentifier(dec.name)) {
                        yield addToVolatile(dec);
                    } else {
                        for (const element of dec.name.elements) {
                            yield addToVolatile(element);
                        }
                    }
                }
            }
        } else {
            return true;
        }
    }
    return;
};

const isFunc = (v: ts.VariableDeclaration) => (v.initializer && (
    ts.isArrowFunction(v.initializer) ||
    ts.isFunctionExpression(v.initializer)));

export const swapLambdas: Swapper = function* (n) {
    if (ts.isFunctionExpression(n) || ts.isArrowFunction(n)) {
        const name = readNodeFuncName(n);

        yield name ? ts.createPropertyAccess(
            ts.createThis(),
            ts.createIdentifier(name)
        ) : n;
    }
    return;
};

export const toFragSafe = (ctx: CompScriptTransformCtx, exp: JsxExpression): string =>
    asCode(cloneDeep(exp.sourceAstNode.expression!, undefined, n =>
        swapVirtualElements(n, ctx).next().value as ts.Node
    ) as ts.Expression);

export const handleArrowFunc: Swapper = function* (n, { parser }, skipArrow?: ts.Node) {
    if (n !== skipArrow && n.parent && ts.isArrowFunction(n.parent)) {
        yield ts.createReturn(
            parser(n, n).next().value
        );
    }
    return;
};
