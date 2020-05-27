import flatMap from 'lodash/flatMap';
import { findJsxRoot, findJsxExpression, getComponentTag } from './../visitors/jsx';
import { scan, ScannerApi } from '../ast-utils/scanner';
import { JsxRoot, JsxElm, JsxComponent, JsxAttribute } from './types';
import ts from 'typescript';
import { findUsedVariables, mergeUsedVariables } from './find-used-variables';
import { parseExpression } from './jsx.expression';
import { isTsJsxRoot, isTsFunction } from './types.is.type';

export function jsxRoots(astNode: ts.Node): JsxRoot[] {
    return scan(astNode, findJsxRoot)
        .map(({ node }) => jsxRoot(node as JsxElm));
}

function jsxRoot(sourceAstNode: JsxElm) {
    const expressions = scan(sourceAstNode, findJsxExpression).map(({ node }) => parseExpression(node));
    const components = scan(sourceAstNode, findJsxComponent).map<JsxComponent>(i => i.metadata);
    const variables = findUsedVariables(sourceAstNode, node => isTsJsxRoot(node) || isTsFunction(node));
    const aggregatedVariables = findUsedVariables(sourceAstNode);
    const root: JsxRoot = {
        kind: 'JsxRoot',
        expressions,
        sourceAstNode,
        components,
        variables,
        aggregatedVariables
    };
    return root;

    return root;


    function findJsxComponent(jsxCompNode: ts.Node, { ignoreChildren }: ScannerApi): JsxComponent | undefined {
        const name = getComponentTag(jsxCompNode);
        if (name) {
            ignoreChildren();
            const { attributes } = ts.isJsxElement(jsxCompNode)
                ? jsxCompNode.openingElement
                : jsxCompNode as ts.JsxSelfClosingElement;
            const props = attributes.properties.reduce<JsxAttribute[]>(
                (acc, attribute) => {
                    const att = attribute as ts.JsxAttribute;
                    const { initializer } = att;

                    if (att.name) {
                        const value = !initializer ? true :
                            ts.isStringLiteral(initializer!)
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
            const childrenNode = ts.isJsxElement(jsxCompNode) ? jsxCompNode.children : {};
            const compUsedVars = findUsedVariables(jsxCompNode, n => n === childrenNode || isTsJsxRoot(n) || isTsFunction(n));
            const compAggVars = findUsedVariables(jsxCompNode);
            const items = findChildren(jsxCompNode);

            const childComponents = flatMap(items, 'components');
            const childExpressions = flatMap(items, 'expressions');

            const childrenUsedVariables = mergeUsedVariables(items.map(item => item.variables));
            const childrenAggregatedVars = mergeUsedVariables(items.map(item => item.aggregatedVariables));
            const comp: JsxComponent = {
                kind: 'JsxComponent',
                name,
                props,
                variables: compUsedVars,
                aggregatedVariables: compAggVars,
                sourceAstNode: jsxCompNode as JsxElm,
                children: items.length ? {
                    kind: 'JsxFragment',
                    components: childComponents,
                    expressions: childExpressions,
                    variables: childrenUsedVariables,
                    aggregatedVariables: childrenAggregatedVars,
                    items,
                    sourceAstNode: jsxCompNode as ts.JsxFragment
                } : undefined
            };
            return comp;
        }
        return;
    }

    function findChildren(jsxCompNode: ts.Node) {
        const children: JsxRoot[] = [];
        if (!ts.isJsxSelfClosingElement(jsxCompNode)) {
            jsxCompNode.forEachChild(jsxNode => {
                if (!(ts.isJsxOpeningElement(jsxNode)
                    || ts.isJsxClosingElement(jsxNode))) {
                    children.push(jsxRoot(jsxNode as JsxElm));
                }
            });
        }
        return children;
    }
};
