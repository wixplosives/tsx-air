import { findJsxComponent, findJsxText, getTextBlockChildren, getComponentTag } from './../../visitors/jsx';
import { scan, find } from './../../astUtils/scanner';
import * as ts from 'typescript';
import { TSXAirData } from '../../visitors/tsxair';
import { findJsxExpression, findJsxRoot } from '../../visitors/jsx';
import { transpileNode } from '../../astUtils/marker';
import { SyntaxKind } from 'typescript';

export const toString = (node: ts.Node, tsxAirData: TSXAirData) => {
    const returnedJsx = scan(node, findJsxRoot);
    if (returnedJsx.length > 1) {
        throw new Error('Multiple JSX root not supported (YET)');
    }
    if (returnedJsx.length === 0) {
        throw new Error('No JSX root returned');
    }
    const jsx = returnedJsx[0].node;
    const expressions = scan(jsx, findJsxExpression);
    const components = scan(jsx, findJsxComponent);


    return `(${tsxAirData.propsIdentifier})=>\`${
        transpileNode(jsx,
            [...expressions, ...components], p => {
                const { metadata } = p;
                switch (metadata.kind) {
                    case 'JSXExpression':
                        return `<!-- Hydrate: ${metadata.sourceText} -->runtime.tsxAirToString($${metadata.sourceText})<!-- End: ${metadata.sourceText} -->`;
                    case 'Component':
                        return `\${${metadata.tag}.factory.toString({${metadata.props.map((i: any) =>
                            `${i.name}:${i.value}`)
                            .join(',')}})}`;
                    default:
                        throw new Error('Unsupported AST node');
                }
            })
        }\``;
};

export const hydrate = (node: ts.Node, tsxAirData: TSXAirData) => {

    const expressions: string[] = ['root'];
    const returnedJsx = find(node, findJsxRoot);

    const addExpressions = (nd: ts.Node, prefix = 'root.childNode') => {
        let childCount = 0;
        let compCount = 0;
        nd.forEachChild(child => {
            switch (child.kind) {
                case SyntaxKind.JsxText:
                    childCount++;
                    break;
                case SyntaxKind.JsxExpression:
                    expressions.push(`exp${expressions.length}: ${prefix}[${childCount + 1}]`);
                    childCount += 3;
                    break;
                case SyntaxKind.JsxElement:
                case SyntaxKind.JsxSelfClosingElement:
                    const tag = getComponentTag(child);
                    if (tag) {
                        expressions.push(`${tag}${++compCount}: ${tag}.factory.hydrate(${prefix}[${childCount}])`);
                    } else {
                        addExpressions(child, `${prefix}[${childCount}].childNode`);
                    }
                    childCount++;
                    break;
                default:
                // throw new Error('Unhandled JSX hydration');
            }
        });
    };

    addExpressions(returnedJsx);

    return `(root,${tsxAirData.propsIdentifier})=>
        new ${tsxAirData.name}({
            ${expressions.join(',\n')}
        })
    `;
};