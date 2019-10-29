import * as  ts from 'typescript';
import { Visitor, scan } from '../astUtils/scanner';
import { uniq } from 'lodash';
export interface TSXAirData {
    kind: 'TSXAIR';
    name: string;
    propsIdentifier: string;
    usedProps: string[];
}

export interface JSXRootData {
    kind: 'JSXRoot';
    name: 'string';
    expressions: string[];
}
export const tsxair: Visitor<TSXAirData> = (node, { ignoreChildren }) => {
    if (ts.isCallExpression(node) && node.expression.getText() === 'TSXAir') {
        ignoreChildren();
        const parent = node.parent;
        let name = 'unknown';
        // const fragments = scan(node, findJsxRoot);
        if (ts.isVariableDeclaration(parent)) {
            name = parent.name.getText();
        }
        const userMethod = node.arguments[0];
        if(!ts.isArrowFunction(userMethod) && !ts.isFunctionDeclaration(userMethod)){
            throw new Error('unhandled input');
        }
        const propsIdentifier = userMethod.parameters[0].name.getText();
        
        return {
            kind: 'TSXAIR',
            name,
            propsIdentifier,
            usedProps: findUsedProps(node, propsIdentifier)
        };
    }
    return undefined;
};

const findUsedProps = (node:ts.Node, name:string) =>  uniq(
        scan(node, n => {
            if (ts.isPropertyAccessExpression(n) && n.expression.getText() === name) {
                return n.name.getText();
            }
            return;
    }).map(i => i.metadata));
    


