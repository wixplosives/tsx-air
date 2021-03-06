import * as ts from 'typescript';
import { Analyzer, FuncDefinition, Parameter } from './types';
import { errorNode, aggregateAstNodeMapping, addToNodesMap } from './types.helpers';
import { findUsedVariables } from './find-used-variables';
import { scan } from '../ast-utils/scanner';
import { findFunction } from '../visitors/functions';
import { jsxRoots } from './jsxroot';
import { isTsFunction, isTsJsxRoot } from './types.is.type';
import { asCode } from '..';

export const funcParams = (func: ts.FunctionLikeDeclaration) =>
    func.parameters.map<Parameter>(p => ({
        kind: 'Parameter',
        name: asCode(p.name),
        sourceAstNode: p,
        default: p.initializer
            ? asCode(p.initializer)
            : undefined
    }));

export const funcDefinition: Analyzer<FuncDefinition> = astNode => {
    if (!isTsFunction(astNode)) {
        return errorNode<FuncDefinition>(astNode, 'Not a function definition', 'internal');
    }

    const variables = findUsedVariables(astNode, n => isTsFunction(n) || isTsJsxRoot(n));
    const aggregatedVariables = findUsedVariables(astNode);

    const funcDef: FuncDefinition = {
        kind: 'funcDefinition',
        name: ts.isVariableDeclaration(astNode.parent) ? astNode.parent.name.getText() : undefined,
        sourceAstNode: astNode,
        variables,
        aggregatedVariables,
        definedFunctions: functions(astNode.body),
        parameters: funcParams(astNode),
        jsxRoots: jsxRoots(astNode)
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
