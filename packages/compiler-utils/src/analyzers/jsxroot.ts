import flatMap from 'lodash/flatMap';
import uniqBy from 'lodash/uniqBy';
import { Visitor } from './../astUtils/scanner';
import { findJsxRoot, findJsxExpression, getComponentTag } from './../visitors/jsx';
import { scan, ScannerApi } from '../astUtils/scanner';
import { CompProps, JsxExpression, JsxRoot, JsxElm, JsxComponent, JsxAttribute, isJsxExpression, isTSJSXRoot, isTSFunction } from './types';
import ts, { isJsxElement } from 'typescript';
import { findUsedVariables, mergeUsedVariables } from './find-used-variables';

export function jsxRoots(astNode: ts.Node, propsIdentifier: string | undefined, usedProps: CompProps[]) {
    return scan(astNode, findJsxRoot)
        .map(({ node }) => jsxRoot(node as JsxElm, propsIdentifier!, usedProps));
}

const jsxRoot = (sourceAstNode: JsxElm, propsIdentifier: string, usedProps: CompProps[]) => {
    const expressions = scan(sourceAstNode, findJsxExpression).map(({ node }) => parseExpression(node));
    const components = scan(sourceAstNode, findJsxComponent).map<JsxComponent>(i => i.metadata);
    const variables = findUsedVariables(sourceAstNode, node => isTSJSXRoot(node) || isTSFunction(node));
    const agregatedVariables = findUsedVariables(sourceAstNode);
    const root: JsxRoot = {
        kind: 'JsxRoot',
        expressions,
        sourceAstNode,
        components,
        variables,
        agregatedVariables
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

        if (ts.isJsxExpression(n) && n.expression) {
            const expVariables = findUsedVariables(n, node => isTSJSXRoot(node) || isTSFunction(node));
            const expAgregatedVariables = findUsedVariables(n);
            const result: JsxExpression = {
                kind: 'JsxExpression',
                dependencies: scan(n, findExpressionDependencies).map(i => i.metadata),
                sourceAstNode: n as ts.JsxExpression,
                expression: n.expression.getText(),
                variables: expVariables,
                agregatedVariables: expAgregatedVariables
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
            const compUsedVars = findUsedVariables(jsxCompNode, n => n === childrenNode || isTSJSXRoot(n) || isTSFunction(n));
            const compAggVars = findUsedVariables(jsxCompNode);
            const items = findChildren(jsxCompNode);

            const childComponents = flatMap(items, 'components');
            const childExpressions = flatMap(items, 'expressions');
            const dependencies: CompProps[] = uniqBy([
                ...flatMap(props.filter(p => isJsxExpression(p.value))
                    .map(p => (p.value as JsxExpression).dependencies)),
                ...flatMap(childComponents.map(c => c.dependencies)),
                ...flatMap(childExpressions.map(c => c.dependencies))], 'name');

            const childrenUsedVariables = mergeUsedVariables(items.map(item => item.variables));
            const childrenAgregatedVars = mergeUsedVariables(items.map(item => item.agregatedVariables));
            const comp: JsxComponent = {
                kind: 'JsxComponent',
                name,
                props,
                variables: compUsedVars,
                agregatedVariables: compAggVars,
                sourceAstNode: jsxCompNode as JsxElm,
                children: items.length ? {
                    kind: 'JsxFragment',
                    components: childComponents,
                    expressions: childExpressions,
                    variables: childrenUsedVariables,
                    agregatedVariables: childrenAgregatedVars,
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
