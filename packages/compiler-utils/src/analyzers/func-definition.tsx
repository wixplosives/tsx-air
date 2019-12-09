import * as ts from 'typescript';
import { Analyzer, FuncDefinition, isTSFunction, isTSJSXRoot } from './types';
import { errorNode, aggregateAstNodeMapping, addToNodesMap } from './types.helpers';
import { findUsedVariables } from './find-used-variables';
import { scan } from '../astUtils/scanner';
import { findFunction } from '../visitors/functions';
import { jsxRoots } from './jsxroot';

export const funcDefinition: Analyzer<FuncDefinition> = astNode => {
    if (!isTSFunction(astNode)) {
        return errorNode<FuncDefinition>(astNode, 'Not a function definition', 'internal');
    }

    const variables = findUsedVariables(astNode, n => isTSFunction(n) || isTSJSXRoot(n));
    const agregatedVariables = findUsedVariables(astNode);

    const funcDef: FuncDefinition = {
        kind: 'funcDefinition',
        name: ts.isVariableDeclaration(astNode.parent) ? astNode.parent.name.getText() : undefined,
        sourceAstNode: astNode,
        variables,
        agregatedVariables,
        definedFunctions: functions(astNode.body),
        arguments: astNode.parameters.map(param => param.name.getText()),
        jsxRoots: jsxRoots(astNode, undefined, [])
    };
    const astToTsxAir = aggregateAstNodeMapping(funcDef.jsxRoots);
    addToNodesMap(astToTsxAir, funcDef);
    return {
        tsxAir: funcDef,
        astToTsxAir
    };
};


export const functions = (astNode: ts.Node) => {
    return scan(astNode, findFunction)
        .map(({ node }) => funcDefinition(node).tsxAir as FuncDefinition);
};