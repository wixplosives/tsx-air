import { Visitor } from '../ast-utils/scanner';
import ts from 'typescript';
import { isTsJsxRoot } from '../analyzers/types.is.type';
import { printAstText } from '..';

export const findJsxRoot: Visitor = (node, { ignoreChildren }) => {
    if (
        isTsJsxRoot(node)
    ) {
        ignoreChildren();
        return {
            type: 'jsxRoot'
        };
    }
    return undefined;
};

export const findJsxNode: Visitor = node => {
    if (
        isTsJsxRoot(node)
    ) {
        return '/* Jsx */';
    }
    return undefined;
};

export const getComponentTag = (node: ts.Node) => {
    let tag = '';
    if (ts.isJsxElement(node)) {
        tag = printAstText(node.openingElement.tagName);
    }
    if (ts.isJsxSelfClosingElement(node) || ts.isJsxOpeningElement(node)) {
        tag = printAstText(node.tagName);
    }

    return (tag && tag.match(/[A-Z].*/)) ? tag : undefined;
};

export const findJsxComponent: Visitor = (node, { ignoreChildren }) => {
    const tag = getComponentTag(node);

    if (tag) {
        ignoreChildren();
        const props = (node as ts.JsxOpeningElement).attributes.properties.reduce<Array<{ name: string, value: string }>>(
            (acc, attribute) => {
                const att = attribute as ts.JsxAttribute;
                if (att.name) {
                    acc.push(
                        {
                            name: att.name.escapedText as string,
                            value: ts.isStringLiteral(att.initializer!)
                                ? att.initializer.getText()
                                : att.initializer!.expression && att.initializer!.expression.getText() || ''
                        });
                }

                return acc;
            },
            []
        );
        return {
            kind: 'Component',
            tag,
            props
        };
    }
    return undefined;
};

export interface JSXExpressionData {
    kind: 'JSXExpression';
    sourceText: string;
}

export const findJsxExpression: Visitor<JSXExpressionData> = (node, { ignoreChildren }) => {
    if (ts.isJsxExpression(node) && node.expression) {
        return {
            kind: 'JSXExpression',
            sourceText: node.getText()
        };
    }
    if (getComponentTag(node)) {
        ignoreChildren();
    }
    return undefined;
};

export const findJsxText: Visitor<{ kind: string, text: string }> = node => {
    if (ts.isJsxExpression(node)) {
        return {
            kind: 'JSXText',
            text: node.getText()
        };
    }
    return undefined;
};

export const getTextBlockChildren: Visitor<Node[][]> = node => {
    if (!ts.isJsxElement(node)) {
        return;
    }
    const { children } = node;
    const texts: Node[][] = [];
    let current: Node[] = [];

    children.forEach(i => {
        if (ts.isJsxText(i) || ts.isJsxExpression(i)) {
            current.push(i);
        } else {
            if (current.length > 0) {
                texts.push(current);
                current = [];
            }
        }
    });
    if (current.length > 0) {
        texts.push(current);
    }

    return texts;
};