import { propsAndStateParams } from './helpers';
import { findUsedVariables, CompDefinition, FuncDefinition, createBitWiseOr, cloneDeep, cArrow, UsedVariables, printAst } from '@tsx-air/compiler-utils';
import flatMap from 'lodash/flatMap';
import ts, { isFunctionDeclaration } from 'typescript';

export function generateStateAwareFunction(comp: CompDefinition, func?: FuncDefinition) {
    const src = func
        ? func.sourceAstNode
        : comp.sourceAstNode.arguments[0] as ts.ArrowFunction;
    let clone = cloneDeep(src);
    if (!ts.isBlock(clone.body)) {
        clone.body = ts.createBlock([ts.createReturn(clone.body)]);
    }
    const { statements } = (clone.body as ts.Block);
    clone.body.statements = ts.createNodeArray(statements.map((s, i) => {
        if (ts.isVariableStatement(s)) {
            const used = findUsedVariables(s);
            if (comp.stores.some(store => used.defined[store.name])) {
                return undefined;
            }
        }
        if (ts.isExpressionStatement(s)) {
            return cStateCall(comp, s.expression, !func) || s;
        }
        if (ts.isReturnStatement(s) && !func) {
            return undefined;
        }
        if (ts.isReturnStatement(s) && s.expression) {
            return cStateCall(comp, s.expression, !func) || s;
        }
        // TODO: add general inner functions support, this coe should help:
        // const ff = comp.functions.find(f => {
        //     const srcStatement = (clone.body as ts.Block).statements ?
        //         (clone.body as ts.Block).statements[i] : clone.body;
        //     return (ts.isVariableStatement(srcStatement))
        //         && srcStatement.declarationList.declarations.find(
        //             d => printAst(d.initializer!) === printAst(f.sourceAstNode)
        //         );
        // });
        // if (ff) {
        //     const ss = (s as ts.VariableStatement);
        //     const modFunc = generateStateAwareFunction(comp, ff);
        //     ss.declarationList.declarations[0].initializer = modFunc;
        // }
        if (!func && ts.isVariableStatement(s) && s.declarationList.declarations) {
            const noFuncs = s.declarationList.declarations.filter(({ initializer }) => initializer && 
                !ts.isArrowFunction(initializer) && !ts.isFunctionExpression(initializer)); 
            if (noFuncs.length) {
                s.declarationList.declarations = ts.createNodeArray(noFuncs);
            } else {
                return undefined;
            }
        }
        return s;
    }).filter(i => i) as ts.Statement[]);
    if (!func) {
        clone = cArrow(propsAndStateParams(comp), clone.body);
    }
    return clone;
}

export const cStateCall = (comp: CompDefinition, exp: ts.Expression, preRender: boolean) => {
    const used = findUsedVariables(exp);
    const changeBits = flatMap(used.modified,
        (v, m) => Object.keys(v).map(k => `${m}.${k}`));

    return changeBits.length === 0
        ? undefined
        : ts.createExpressionStatement(ts.createCall(
            ts.createPropertyAccess(
                ts.createPropertyAccess(
                    ts.createIdentifier('TSXAir'),
                    ts.createIdentifier('runtime')
                ),
                ts.createIdentifier('updateState')
            ),
            undefined,
            [
                ts.createThis(),
                ts.createArrowFunction(
                    undefined,
                    undefined,
                    [ts.createParameter(
                        undefined,
                        undefined,
                        undefined,
                        ts.createObjectBindingPattern(
                            comp.stores.map(s =>
                                ts.createBindingElement(
                                    undefined,
                                    undefined,
                                    ts.createIdentifier(s.name),
                                )
                            )),
                    )],
                    undefined,
                    ts.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
                    ts.createBlock(
                        [
                            ts.createExpressionStatement(exp),
                            ts.createReturn(createBitWiseOr(comp.name!, changeBits, preRender ? ['preRender'] : undefined))
                        ],
                        true
                    )
                )
            ]
        ));
};
