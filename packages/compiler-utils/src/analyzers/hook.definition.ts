import { Analyzer, AnalyzerResult, findUsedVariables, HookDefinition, isTsFunction, isTsJsxRoot } from '.';
import ts from 'typescript';
import { addToNodesMap, aggregateAstNodeMapping, errorNode } from './types.helpers';
import { getStoresDefinitions } from './store-definition';
import { asCode } from '..';
import { jsxRoots } from './jsxroot';
import { functions } from './func-definition';
import { findReturns } from './find.return';

export const hookDefinition: Analyzer<HookDefinition> = (astNode: ts.Node) => {
    if (!ts.isCallExpression(astNode) || astNode.expression.getText() !== 'Hook') {
        return errorNode<HookDefinition>(astNode, 'Not a hook definition', 'internal');
    }

    const compFunc = astNode.arguments[0];
    if (astNode.arguments.length !== 1 ||
        !(isTsFunction(compFunc))
    ) {
        return errorNode<HookDefinition>(astNode, 'Hook must be called with a single (function) argument', 'code');
    }
    const name = asCode((astNode.parent as any).name);
    const variables = findUsedVariables(compFunc, node => isTsJsxRoot(node) || isTsFunction(node));
    const aggregatedVariables = findUsedVariables(compFunc);
    const propsName = compFunc.parameters[0]?.name?.getText();
    const stores = getStoresDefinitions(compFunc.body);
    const propsIdentifier = aggregatedVariables.accessed[propsName]
        ? propsName : undefined;
    const volatileVariables = Object.keys(variables.defined).filter(ns =>
        ns !== propsIdentifier &&
        !stores.some(s => s.name === ns)
    );

    const returns = findReturns(compFunc);

    const tsxAir: HookDefinition = {
        kind: 'HookDefinition',
        name,
        aggregatedVariables,
        variables,
        volatileVariables,
        sourceAstNode: astNode,
        jsxRoots: jsxRoots(astNode),
        functions: functions(compFunc.body),
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
