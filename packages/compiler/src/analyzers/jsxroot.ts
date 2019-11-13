import { flatMap, uniqBy } from 'lodash';
import { Visitor } from './../astUtils/scanner';
import { findJsxRoot, findJsxExpression, getComponentTag } from './../visitors/jsx';
import { scan, ScannerApi } from '../astUtils/scanner';
import { CompProps, JsxExpression, JsxRoot, JsxElm, JsxComponent, JsxAttribute, isJsxExpression } from './types';
import ts, { isJsxElement } from 'typescript';

export function jsxRoots(astNode: ts.Node, propsIdentifier: string | undefined, usedProps: CompProps[]) {
    return scan(astNode, findJsxRoot)
        .map(({ node }) => jsxRoot(node as JsxElm, propsIdentifier!, usedProps));
}

const jsxRoot = (sourceAstNode: JsxElm, propsIdentifier: string, usedProps: CompProps[]) => {
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
                if (ts.isPropertyAccessExpression(nd) && nd.expression.getText() === propsIdentifier) {
                    const name = nd.name.getText();
                    return usedProps.find(p => p.name === name);
                }
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
            const props = attributes.properties.reduce<JsxAttribute[]>(
                (acc, attribute) => {
                    const att = attribute as ts.JsxAttribute;
                    const { initializer } = att;

                    if (att.name) {
                        const value = ts.isStringLiteral(initializer!)
                            ? initializer.text
                            : parseExpression(initializer!);
                        acc.push(
                            {
                                kind: 'JsxAttribute',
                                name: att.name.escapedText as string,
                                sourceAstNode: attribute as ts.JsxAttribute,
                                value
                            });
                    }
                    return acc;
                },
                []
            );

            const items = findChildren(jsxCompNode);
            const childComponents = flatMap(items, 'components');
            const childExpressions = flatMap(items, 'expressions');
            const dependencies: CompProps[] = uniqBy([
                ...flatMap(props.filter(p => isJsxExpression(p.value))
                    .map(p => (p.value as JsxExpression).dependencies)),
                ...flatMap(childComponents.map(c => c.dependencies)),
                ...flatMap(childExpressions.map(c => c.dependencies))], 'name');

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
                } : undefined,
                dependencies
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
            children.push(jsxRoot(jsxNode as JsxElm, propsIdentifier, usedProps));
        });
        return children;
    }
};
