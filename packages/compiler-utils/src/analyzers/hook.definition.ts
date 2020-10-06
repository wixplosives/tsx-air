import { Analyzer, AnalyzerResult, findUsedVariables, HookDefinition, isTsFunction, isTsJsxRoot } from '.';
import ts from 'typescript';
import { addToNodesMap, aggregateAstNodeMapping, errorNode } from './types.helpers';
import { getStoresDefinitions } from './store-definition';
import { asCode } from '..';
import { jsxRoots } from './jsxroot';
import { funcParams, functions } from './func-definition';
import { findReturns } from './find.return';

export const hookDefinition: Analyzer<HookDefinition> = (astNode: ts.Node) => {
    if (!ts.isCallExpression(astNode) || astNode.expression.getText() !== 'Hook') {
        return errorNode<HookDefinition>(astNode, 'Not a hook definition', 'internal');
    }

    const hookFunc = astNode.arguments[0];
    if (astNode.arguments.length !== 1 ||
        !(isTsFunction(hookFunc))
    ) {
        return errorNode<HookDefinition>(astNode, 'Hook must be called with a single (function) argument', 'code');
    }
    const name = asCode((astNode.parent as any).name);
    const variables = findUsedVariables(hookFunc, node => isTsJsxRoot(node) || isTsFunction(node));
    const aggregatedVariables = findUsedVariables(hookFunc);
    const propsName = hookFunc.parameters[0]?.name?.getText();
    const stores = getStoresDefinitions(hookFunc.body);
    const propsIdentifier = aggregatedVariables.accessed[propsName]
        ? propsName : undefined;
    const volatileVariables = Object.keys(variables.defined).filter(ns =>
        ns !== propsIdentifier &&
        !stores.some(s => s.name === ns)
    );

    const returns = findReturns(hookFunc);

    const tsxAir: HookDefinition = {
        kind: 'HookDefinition',
        name,
        parameters: funcParams(hookFunc),
        aggregatedVariables,
        variables,
        volatileVariables,
        sourceAstNode: astNode,
        jsxRoots: jsxRoots(astNode),
        functions: functions(hookFunc.body),
        stores,
        returns
    };
    const astToTsxAir = aggregateAstNodeMapping(tsxAir.jsxRoots);
    addToNodesMap(astToTsxAir, tsxAir);
    return {
        tsxAir,
        astToTsxAir
    } as AnalyzerResult<HookDefinition>;
};
