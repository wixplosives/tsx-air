import { CompDefinition, JsxAttribute } from '@wixc3/tsx-air-compiler-utils/src/analyzers/types';
import { findJsxComponent } from '@wixc3/tsx-air-compiler-utils/src/visitors/jsx';
import { scan } from '@wixc3/tsx-air-compiler-utils/src//astUtils/scanner';
import { findJsxExpression, findJsxRoot } from '@wixc3/tsx-air-compiler-utils/src/visitors/jsx';
import { transpileNode } from '@wixc3/tsx-air-compiler-utils/src/astUtils/marker';
import { DomBinding } from '@wixc3/tsx-air-compiler-utils/src/transformers/generators/component-common';
import ts from 'typescript';

export const compFactory = (dom: DomBinding[], def: CompDefinition) => {
    return `${def.name}.factory = {
        initialState: ()=>({}),
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
    const attributes = scan(jsx, n => {
        if (ts.isJsxAttribute(n)) {
            const { name, initializer} = n;
            const att:JsxAttribute = {
                kind: 'JsxAttribute',
                name: name.escapedText as string,
                sourceAstNode: n,
                value: initializer ? initializer.getText() : true
            };
            return att;
        }
        return;
    });


    return `(${def.propsIdentifier})=>\`${
        transpileNode(jsx,
            [...expressions, ...components, ...attributes], p => {
                const { metadata } = p;
                switch (metadata.kind) {
                    case 'JSXExpression':
                        return `<!-- ${metadata.sourceText} -->$${metadata.sourceText}<!-- /${metadata.sourceText} -->`;
                    case 'Component':
                        return `\${${metadata.tag}.factory.toString({${metadata.props.map((i: any) =>
                            `${i.name}:${i.value}`)
                            .join(',')}})}`;
                    case 'JsxAttribute':
                        const att = metadata as JsxAttribute;
                        if (att.name === 'className') {
                            return `class=${att.value}`;
                        }
                        return;
                    default:
                        throw new Error('Unsupported AST node');
                }
            })
        }\``;
};

const hydrate = (dom: DomBinding[], def: CompDefinition) => {
    const ctx = [{ ctxName: 'root', viewLocator: 'root' }, ...dom].map(
        (i: DomBinding) => `${i.ctxName}:${i.viewLocator}`).join();

    return `(root, ${def.propsIdentifier})=>new ${def.name}({${ctx}}, ${def.propsIdentifier})`;
};