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

export const functions = (astNode: ts.Node, knownFuncs: FuncDefinition[]) => {
    const funcDefinition: Analyzer<FuncDefinition> = node => {
        if (!isTsFunction(node)) {
            return errorNode<FuncDefinition>(node, 'Not a function definition', 'internal');
        }

        const variables = findUsedVariables(node, n => isTsFunction(n) || isTsJsxRoot(n));
        const aggregatedVariables = findUsedVariables(node);

        const funcDef: FuncDefinition = {
            kind: 'FuncDefinition',
            name: ts.isVariableDeclaration(node.parent) ? node.parent.name.getText() : undefined,
            sourceAstNode: node,
            variables,
            aggregatedVariables,
            functions: functions(node.body, knownFuncs),
            parameters: funcParams(node),
            jsxRoots: jsxRoots(node, [])
        };

        const astToTsxAir = aggregateAstNodeMapping(funcDef.jsxRoots);
        addToNodesMap(astToTsxAir, funcDef);
        return {
            tsxAir: funcDef,
            astToTsxAir
        };
    };

    scan(astNode, findFunction).forEach(({ node }) => {
        if (!knownFuncs.find(fn => fn.sourceAstNode === node)) {
            knownFuncs.push(funcDefinition(node).tsxAir as FuncDefinition);
        }
    });
    return knownFuncs;
};
