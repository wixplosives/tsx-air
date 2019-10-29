import { findJsxComponent } from './../../visitors/jsx';
import { scan } from './../../astUtils/scanner';
import * as ts from 'typescript';
import { TSXAirData } from '../../visitors/tsxair';
import { findJsxExpression, findJsxRoot } from '../../visitors/jsx';
import { transpileNode } from '../../astUtils/marker';

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
                        return `$${metadata.sourceText}`;
                    case 'Component':
                        return `\${${metadata.tag}.toString({${metadata.props.map((i: any) =>
                            `${i.name}:${i.value}`)
                            .join(',')}})}`;
                    default:
                        throw new Error('Unsupported AST node');
                }
            })
        }\``;
};

// export const hydrate = (node: ts.Node, tsxAirData: TSXAirData) => {
//     const returnedJsx = scan(node, findJsxRoot);
//     if (returnedJsx.length > 1) {
//         throw new Error('Multiple JSX root not supported (YET)');
//     }
//     if (returnedJsx.length === 0) {
//         throw new Error('No JSX root returned');
//     }
//     const jsx = returnedJsx[0].node;
//     const texts = scan(jsx, findJsxExpression);
//     const components = scan(jsx, findJsxComponent);

//     return `(root, ${tsxAirData.propsIdentifier})=>\`new ${tsxAirData.name}({
//         root,

//     })${
//         transpileNode(jsx, 
//             [...expressions, ...components], p => {
//             switch (p.note.kind) {
//                 case 'JSXExpression':    
//                     return p.note.sourceText;
//                 case 'Component':                    
//                     return `\${${p.note.tag}.toString({${p.note.props.map((i:any) => 
//                         `${i.name}:${i.value}`)
//                         .join(',')}})}`;
//                 default: 
//                     throw new Error('Unsupported AST node');
//             } 
//             })
//     }\``;
// };
