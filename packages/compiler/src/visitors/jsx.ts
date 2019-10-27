import * as  ts from 'typescript';
import { Visitor, scan } from '../astUtils/scanner';
export interface TSXAirData {
    kind: 'TSXAIR';
    name: string;
}

export interface JSXRootData {
    kind: 'JSXRoot';
    name: 'string';
    expressions: string[];
}
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
        const parent = node.parent;
        let name = 'unknown';
        // const fragments = scan(node, findJsxRoot);
        if (ts.isVariableDeclaration(parent)) {
            name = parent.name.getText();
        }
        return {
            kind: 'TSXAIR',
            name,
        } as TSXAirData;
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
        return {
            type: 'jsxRoot'
        };
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

const findJsxExpression: Visitor = node => {
    if (ts.isJsxExpression(node)) {
        return '/* Expression */';
    }
    return undefined;
};