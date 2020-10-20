import { JsxExpression } from '@tsx-air/compiler-utils';
import ts from 'typescript';
import { isTsJsxRoot, isTsFunction } from './types.is.type';
import { findUsedVariables } from './find-used-variables';
import { jsxRoots } from './jsxroot';

export function parseExpression(n: ts.Node) {
    if (ts.isJsxExpression(n) && n.expression) {
        const expVariables = findUsedVariables(n, node => isTsJsxRoot(node) || isTsFunction(node));
        const expAggregatedVariables = findUsedVariables(n);
        const result: JsxExpression = {
            kind: 'JsxExpression',
            sourceAstNode: n as ts.JsxExpression,
            expression: n.expression.getText(),
            variables: expVariables,
            aggregatedVariables: expAggregatedVariables,
            jsxRoots: jsxRoots(n)
        };
        return result;
    } else {
        throw new Error('Invalid node: not an isJsxExpression');
    }
}