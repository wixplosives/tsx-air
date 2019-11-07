import { flatMap } from 'lodash';
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

            const items = findChildren(jsxCompNode);
            const childComponents = flatMap(items, 'components');
            const childExpressions = flatMap(items, 'expressions');

            const comp: JsxComponent = {
                kind: 'JsxComponent',
                name,
                props,
                sourceAstNode: jsxCompNode as JsxElm,
                children: items.length ? {
                    kind: 'JsxFragment',
                    components: childComponents,
                    expressions: childExpressions,
                    items,
                    sourceAstNode: jsxCompNode as ts.JsxFragment
                } : undefined
            };
            return comp;
        }
        return;
    }

    function findChildren(jsxCompNode: ts.Node) {
        if (ts.isJsxSelfClosingElement(jsxCompNode)) {
            return [];
        }
        const children: JsxRoot[] = [];
        jsxCompNode.forEachChild(jsxNode => {
            if (ts.isJsxOpeningElement(jsxNode) 
            || ts.isJsxClosingElement(jsxNode)
            ) {
                return;
            }
            children.push(jsxRoot(jsxNode as JsxElm));
        });
        return children;
    }
};
