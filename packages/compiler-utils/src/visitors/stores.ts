import ts from 'typescript';
import { Visitor } from '../ast-utils/scanner';

export const findStore: Visitor = (node, { ignoreChildren }) => {
    if (
        isStoreDefinition(node)
    ) {
        ignoreChildren();
        return {
            type: 'store'
        };
    }
    return undefined;
};

export function isStoreDefinition(node: ts.Node): node is ts.CallExpression {
    return ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.getText() === 'store';
}