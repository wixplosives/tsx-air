import * as  ts from 'typescript';
import { Visitor, scan } from './../scanner';

export const tsxair: Visitor = (node, ignoreChildren, report) => {
    if (ts.isCallExpression(node) && node.expression.getText() === 'TSXAir') {
        ignoreChildren();
        node.forEachChild(n => {
            report(scan(n, findJsxFragment));
        });
        return '/* TSXAir call */ ';
    }
    return undefined;
};

const findJsxFragment: Visitor = (node, ignoreChildren) => {
    if (
        ts.isJsxElement(node) ||
        ts.isJsxSelfClosingElement(node) ||
        ts.isJsxFragment(node)
    ) {
        ignoreChildren!();
        return '/* Jsx */';
    }
    return undefined;
};