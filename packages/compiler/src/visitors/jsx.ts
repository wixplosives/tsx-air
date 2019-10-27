import * as  ts from 'typescript';
import { Visitor, scan } from '../astUtils/scanner';

export const tsxair: Visitor = (node, { ignoreChildren, report }) => {
    if (ts.isCallExpression(node) && node.expression.getText() === 'TSXAir') {
        ignoreChildren();
        node.forEachChild(n => {
            report(scan(n, findJsxRoot));
        });
        node.forEachChild(n => {
            report(scan(n, findJsxNode));
        });
        node.forEachChild(n => {
            report(scan(n, findJsxComponent));
        });
        node.forEachChild(n => {
            report(scan(n, findJsxExpression));
        });
        return '/* TSXAir call */ ';
    }
    return undefined;
};

const findJsxRoot: Visitor = (node, { ignoreChildren }) => {
    if (
        ts.isJsxElement(node) ||
        ts.isJsxSelfClosingElement(node) ||
        ts.isJsxFragment(node)
    ) {
        ignoreChildren();
        return '/* Root */';
    }
    return undefined;
};

const findJsxNode: Visitor = node => {
    if (
        ts.isJsxElement(node) ||
        ts.isJsxSelfClosingElement(node) ||
        ts.isJsxFragment(node)
    ) {
        return '/* Jsx */';
    }
    return undefined;
};

const findJsxComponent: Visitor = node => {
    let tag = '';
    if (ts.isJsxElement(node)) {
        tag = node.openingElement.tagName.getText();
    }
    if (ts.isJsxSelfClosingElement(node)) {
        tag = node.tagName.getText();
    }
    if (tag.match(/[A-Z].*/)) {
        return '/* Component */';
    }
    return undefined;
};

const findJsxExpression:Visitor = node => {
    if (ts.isJsxExpression(node)) {
        return '/* Expression */';
    }
    return undefined;
};