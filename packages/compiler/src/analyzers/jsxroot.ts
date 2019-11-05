import { findJsxRoot, findJsxExpression } from './../visitors/jsx';
import { scan } from '../astUtils/scanner';
import { CompProps, JsxExpression, JsxRoot, JsxElm } from './types';
import ts, { isPropertyAccessExpression } from 'typescript';

export function jsxRoots(astNode: ts.Node, propsIdentifier: string | undefined, usedProps: CompProps[]) {
    return scan(astNode, findJsxRoot)
        .map(({ node }) => jsxRoot(node as JsxElm, propsIdentifier, usedProps));

}

const jsxRoot = (sourceAstNode: JsxElm, propsIdentifier: string | undefined, usedProps: CompProps[]) => {
    const expressions = scan(sourceAstNode, findJsxExpression).map(({ node }) => {
        const props = new Set(scan(node, nd => isPropertyAccessExpression(nd) &&
            nd.expression.getText() === propsIdentifier && nd.name.getText()).map(n => n.metadata));
        const result: JsxExpression = {
            kind: 'JsxExpression',
            dependencies: usedProps.filter(p => props.has(p.name)),
            sourceAstNode: node as ts.JsxExpression,
            expression: node.getText(),
        };
        return result;
    });
    const root: JsxRoot = {
        kind: 'JsxRoot',
        expressions,
        sourceAstNode
    };
    return root;
};
