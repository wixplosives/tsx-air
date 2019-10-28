import { Visitor } from '../astUtils/scanner';
import { isJsxSelfClosingElement, isJsxElement, isJsxFragment, isJsxExpression } from 'typescript';


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

export  const findJsxComponent: Visitor = (node, {ignoreChildren}) => {
    let tag = '';
    if (isJsxElement(node)) {
        tag = node.openingElement.tagName.getText();
    }
    if (isJsxSelfClosingElement(node)) {
        tag = node.tagName.getText();
    }
    if (tag.match(/[A-Z].*/)) {
        ignoreChildren();
        return '/* Component */';
    }
    return undefined;
};

export  const findJsxExpression: Visitor = node => {
    if (isJsxExpression(node)) {
        return `$`;
    }
    return undefined;
};