import { Visitor } from './../astUtils/scanner';
import { findJsxRoot, findJsxExpression, getComponentTag } from './../visitors/jsx';
import { scan, ScannerApi } from '../astUtils/scanner';
import { CompProps, JsxExpression, JsxRoot, JsxElm, JsxComponent, JsxComponentProps } from './types';
import ts, { isJsxElement } from 'typescript';

export function jsxRoots(astNode: ts.Node, _propsIdentifier: string | undefined, _usedProps: CompProps[]) {
    return scan(astNode, findJsxRoot)
        .map(({ node }) => jsxRoot(node as JsxElm));
}

const jsxRoot = (sourceAstNode: JsxElm) => {
    const expressions = scan(sourceAstNode, findJsxExpression).map(({ node }) => parseExpression(node));
    const components = scan(sourceAstNode, findJsxComponent).map<JsxComponent>(i => i.metadata);

    const root: JsxRoot = {
        kind: 'JsxRoot',
        expressions,
        sourceAstNode,
        components
    };
    return root;

    function parseExpression(n: ts.Node) {
        const findExpressionDependencies: Visitor<CompProps> = (nd, { ignoreChildren }) => {
            if (ts.isPropertyAccessExpression(nd) || ts.isIdentifier(nd)) {
                ignoreChildren();
                return {
                    kind: 'CompProps',
                    name: nd.getText(),
                    sourceAstNode: nd
                };
            }
            return;
        };

        if (ts.isJsxExpression(n)) {
            const result: JsxExpression = {
                kind: 'JsxExpression',
                dependencies: scan(n, findExpressionDependencies).map(i => i.metadata),
                sourceAstNode: n as ts.JsxExpression,
                expression: n.expression!.getText()
            };
            return result;
        } else {
            throw new Error('Invalid node: not an isJsxExpression');
        }
    }

    function findJsxComponent(jsxCompNode: ts.Node, { ignoreChildren }: ScannerApi): JsxComponent | undefined {
        const name = getComponentTag(jsxCompNode);
        if (name) {
            ignoreChildren();
            const { attributes } = isJsxElement(jsxCompNode) ? jsxCompNode.openingElement : jsxCompNode as ts.JsxSelfClosingElement;
            const props = attributes.properties.reduce<JsxComponentProps[]>(
                (acc, attribute) => {
                    const att = attribute as ts.JsxAttribute;
                    const { initializer } = att;

                    if (att.name) {
                        acc.push(
                            {
                                kind: 'JsxComponentProps',
                                name: att.name.escapedText as string,
                                sourceAstNode: attribute as ts.JsxAttribute,
                                value: ts.isStringLiteral(initializer!)
                                    ? initializer.text
                                    : parseExpression(initializer!)
                            });
                    }
                    return acc;
                },
                []
            );
            const comp: JsxComponent = {
                kind: 'JsxComponent',
                name,
                props,
                sourceAstNode: jsxCompNode as JsxElm
            };
            return comp;
        }
        return;
    }
};
