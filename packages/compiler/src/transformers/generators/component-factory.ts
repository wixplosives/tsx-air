import { CompDefinition } from './../../analyzers/types';
import { findJsxComponent } from './../../visitors/jsx';
import { scan } from './../../astUtils/scanner';
import { findJsxExpression, findJsxRoot } from '../../visitors/jsx';
import { transpileNode } from '../../astUtils/marker';
import { DomBinding } from './component-common';

export const compFactory = (dom: DomBinding[], def: CompDefinition) => {
    return `${def.name}.factory = {
        initialState: ()=>{},
        toString: ${toString(def)},
        hydrate: ${hydrate(dom, def)}
    };`;
};

const toString = (def: CompDefinition) => {
    const returnedJsx = scan(def.sourceAstNode, findJsxRoot);
    if (returnedJsx.length > 1) {
        throw new Error('Multiple JSX root not supported (YET)');
    }
    if (returnedJsx.length === 0) {
        throw new Error('No JSX root returned');
    }
    const jsx = returnedJsx[0].node;
    const expressions = scan(jsx, findJsxExpression);
    const components = scan(jsx, findJsxComponent);


    return `(${def.propsIdentifier})=>\`${
        transpileNode(jsx,
            [...expressions, ...components], p => {
                const { metadata } = p;
                switch (metadata.kind) {
                    case 'JSXExpression':
                        return `<!-- Hydrate: ${metadata.sourceText} -->runtime.tsxAirToString($${metadata.sourceText})<!-- End: ${metadata.sourceText} -->`;
                    case 'Component':
                        return `\${(${metadata.tag} || exports.${metadata.tag}).factory.toString({${metadata.props.map((i: any) =>
                            `${i.name}:${i.value}`)
                            .join(',')}})}`;
                    default:
                        throw new Error('Unsupported AST node');
                }
            })
        }\``;
};

const hydrate = (dom: DomBinding[], def: CompDefinition) => {
    const ctx = [{ ctxName: 'root', viewLocator: 'root' }, ...dom].map(
        (i: DomBinding) => `${i.ctxName}:${i.viewLocator}`).join();

    return `(root, ${def.propsIdentifier})=>new ${def.name}({${ctx}})`;
};