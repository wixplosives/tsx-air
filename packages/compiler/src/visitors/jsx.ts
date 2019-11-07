import { Visitor } from '../astUtils/scanner';
import { isJsxSelfClosingElement, isJsxElement, isJsxFragment, isJsxExpression, JsxOpeningElement, isStringLiteral, JsxAttribute, Node, isJsxText } from 'typescript';


export const findJsxRoot: Visitor = (node, { ignoreChildren }) => {
    if (
        isJsxElement(node) ||
        isJsxSelfClosingElement(node) ||
        isJsxFragment(node)
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
        isJsxElement(node) ||
        isJsxSelfClosingElement(node) ||
        isJsxFragment(node)
    ) {
        return '/* Jsx */';
    }
    return undefined;
};


export const getComponentTag = (node: Node) => {
    let tag = '';
    if (isJsxElement(node)) {
        tag = node.openingElement.tagName.getText();
    }
    if (isJsxSelfClosingElement(node)) {
        tag = node.tagName.getText();
    }
    return (tag && tag.match(/[A-Z].*/)) ? tag : undefined;
};

export const findJsxComponent: Visitor = (node, { ignoreChildren }) => {
    const tag = getComponentTag(node);

    if (tag) {
        ignoreChildren();
        const props = (node as JsxOpeningElement).attributes.properties.reduce<Array<{ name: string, value: string }>>(
            (acc, attribute) => {
                const att = attribute as JsxAttribute;
                if (att.name) {
                    acc.push(
                        {
                            name: att.name.escapedText as string,
                            value: isStringLiteral(att.initializer!)
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
    if (isJsxExpression(node)) {
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
    if (isJsxExpression(node)) {
        return {
            kind: 'JSXText',
            text: node.getText()
        };
    }
    return undefined;
};

export const getTextBlockChildren: Visitor<Node[][]> = node => {
    if (!isJsxElement(node)) {
        return;
    }
    const { children } = node;
    const texts: Node[][] = [];
    let current: Node[] = [];

    children.forEach(i => {
        if (isJsxText(i) || isJsxExpression(i)) {
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