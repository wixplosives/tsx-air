import { findJsxComponent } from './../../visitors/jsx';
import { scan } from './../../astUtils/scanner';
import * as ts from 'typescript';
import { TSXAirData } from '../../visitors/tsxair';
import { findJsxExpression, findJsxRoot } from '../../visitors/jsx';
import { transpileNode } from '../../astUtils/marker';
import { DomBinding } from './component-common';

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

export const hydrate = (tsxAirData: TSXAirData, expressions: DomBinding[]) =>
    `(root,${tsxAirData.propsIdentifier})=>
        new ${tsxAirData.name}({
            ${[{ ctxName: 'root', viewLocator: 'root' }, ...expressions]
        .map(i => `${i.ctxName}:${i.viewLocator}`).join(',\n')}
        })
    `;