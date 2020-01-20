import * as ts from 'typescript';
import { Analyzer, isTSFunction, isTsJsxRoot, StoreDefinition } from './types';
import { errorNode } from './types.helpers';
import { findUsedVariables } from './find-used-variables';
import { scan } from '../astUtils/scanner';
import { findStore, isStoreDefinition } from '../visitors/stores';

export const storeDefinition: Analyzer<StoreDefinition> = astNode => {
    if (!isStoreDefinition(astNode)) {
        return errorNode<StoreDefinition>(astNode, 'Not a store definition', 'internal');
    }
    const parentDeclaration = astNode.parent;

    if (!ts.isVariableDeclaration(parentDeclaration)) {
        throw new Error('the return value of store must be assigned to a variable declaration');
    }
    if (astNode.arguments.length !== 1) {
        throw new Error('store can only handle one argument');
    }
    const argument = astNode.arguments[0];
    if (!ts.isObjectLiteralExpression(argument)) {
        throw new Error('store can only handle an argument in an object syntax');
    }

    const aggregatedVariables = findUsedVariables(argument);
    const variables = findUsedVariables(argument, n => isTSFunction(n) || isTsJsxRoot(n));

    const storeDef: StoreDefinition = {
        kind: 'storeDefinition',
        name: ts.isVariableDeclaration(astNode.parent) ? astNode.parent.name.getText() : astNode.parent.getText(),
        sourceAstNode: astNode,
        variables,
        aggregatedVariables,
        keys: argument.properties.map(arg => {
            if (!arg.name) {
                throw new Error('store object properties must be a literal string');
            }
            return arg.name.getText();
        })
    };
    return {
        tsxAir: storeDef,
        astToTsxAir: new Map([[astNode, [storeDef]]])
    };
};


export const stores = (astNode: ts.Node) => {
    return scan(astNode, findStore)
        .map(({ node }) => storeDefinition(node).tsxAir as StoreDefinition);
};

