import { Visitor } from '../astUtils/scanner';
import { isJsxSelfClosingElement, isJsxElement, isJsxFragment, isJsxExpression, JsxOpeningElement, isStringLiteral, JsxAttribute } from 'typescript';


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

export const findJsxComponent: Visitor = (node, { ignoreChildren }) => {
    let tag = '';
    if (isJsxElement(node)) {
        tag = node.openingElement.tagName.getText();
    }
    if (isJsxSelfClosingElement(node)) {
        tag = node.tagName.getText();
    }
    if (tag.match(/[A-Z].*/)) {
        ignoreChildren();
        const props = (node as JsxOpeningElement).attributes.properties.reduce<Array<{ name: string, value: string }>>(
            (acc, attribute) => {
                const att = attribute as JsxAttribute;
                acc.push(
                    {
                        name: att.name.escapedText as string,
                        value: isStringLiteral(att.initializer!)
                            ? att.initializer.getText()
                            // @ts-ignore
                            : att.initializer.expression.getText()
                    });
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
export const findJsxExpression: Visitor<JSXExpressionData> = node => {
    if (isJsxExpression(node)) {
        return {
            kind: 'JSXExpression',
            sourceText: node.getText()
        };
    }
    return undefined;
};