import { Analyzer, StoreDefinition } from '.';
import { isStoreDefinition, findStore } from '../visitors/stores';
import { errorNode } from './types.helpers';
import ts from 'typescript';
import { scan } from '..';
import { findUsedVariables } from './find-used-variables';
import { isTsFunction, isTsJsxRoot } from './types.is.type';

const storeDefinition: Analyzer<StoreDefinition> = astNode => {
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
    const variables = findUsedVariables(argument, n => isTsFunction(n) || isTsJsxRoot(n));

    const storeDef: StoreDefinition = {
        kind: 'storeDefinition',
        name: parentDeclaration.name.getText(),
        sourceAstNode: parentDeclaration,
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

export const getStoresDefinitions = (astNode: ts.Node) => {
    return scan(astNode, findStore)
        .map(({ node }) => storeDefinition(node).tsxAir as StoreDefinition);
};

