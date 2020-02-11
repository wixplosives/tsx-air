import { JsxExpression } from '@tsx-air/compiler-utils';
import ts from 'typescript';
import { Visitor, scan } from '../ast-utils/scanner';
import { isTsJsxRoot, isTsFunction } from './types.is.type';
import { findUsedVariables } from './find-used-variables';

export function parseExpression(n: ts.Node) {
    // const findExpressionDependencies: Visitor<UsedNamespace> = (nd, { ignoreChildren }) => {
    //     if (ts.isPropertyAccessExpression(nd) || ts.isIdentifier(nd)) {
    //         ignoreChildren();
    //         if (ts.isPropertyAccessExpression(nd) && nd.expression.getText() === propsIdentifier) {
    //             const name = nd.name.getText();
    //             return usedProps.find(p => p.name === name);
    //         }
    //     }
    //     return;
    // };

    if (ts.isJsxExpression(n) && n.expression) {
        const expVariables = findUsedVariables(n, node => isTsJsxRoot(node) || isTsFunction(node));
        const expAggregatedVariables = findUsedVariables(n);
        const result: JsxExpression = {
            kind: 'JsxExpression',
            sourceAstNode: n as ts.JsxExpression,
            expression: n.expression.getText(),
            variables: expVariables,
            aggregatedVariables: expAggregatedVariables
        };
        return result;
    } else {
        throw new Error('Invalid node: not an isJsxExpression');
    }
}