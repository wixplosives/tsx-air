import { findUsedVariables, CompDefinition, FuncDefinition, createBitWiseOr, cloneDeep } from '@tsx-air/compiler-utils';
import flatMap from 'lodash/flatMap';
import ts from 'typescript';

export function generateStateAwareFunction(comp: CompDefinition, func: FuncDefinition) {
    const clone = cloneDeep(func.sourceAstNode);
    if (!ts.isBlock(clone.body)) {
        clone.body = ts.createBlock([ts.createReturn(clone.body)]);
    }
    const { statements } = (clone.body as ts.Block);
    clone.body.statements = ts.createNodeArray(statements.map(s => {
        // if (ts.isExpressionStatement(s)) {
        //     return cStateCall(comp, [s]) || s;
        // }
        if (ts.isReturnStatement(s) && s.expression) {
            return cStateCall(comp, s.expression) || s;
        }
        return s;
    }));
    return clone;
}

export const cStateCall = (comp: CompDefinition, exp: ts.Expression) => {
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
                            // [exp],
                            ts.createReturn(createBitWiseOr(comp.name!, changeBits))
                        ],
                        true
                    )
                )
            ]
        ));
};
