import { asCode } from '..';
import { CompDefinition, Analyzer, AnalyzerResult } from './types';
import { isCallExpression } from 'typescript';
import { jsxRoots } from './jsxroot';
import { errorNode, aggregateAstNodeMapping, addToNodesMap } from './types.helpers';
import { findUsedVariables } from './find-used-variables';
import { functions } from './func-definition';
import { getStoresDefinitions } from './store-definition';
import { isTsFunction, isTsJsxRoot } from './types.is.type';
import { safely } from '@tsx-air/utils/src';


export const compDefinition: Analyzer<CompDefinition> = astNode => {
    if (!isCallExpression(astNode) || astNode.expression.getText() !== 'TSXAir') {
        return errorNode<CompDefinition>(astNode, 'Not a component definition', 'internal');
    }

    const compFunc = astNode.arguments[0];
    if (astNode.arguments.length !== 1 ||
        !(isTsFunction(compFunc))
    ) {
        return errorNode<CompDefinition>(astNode, 'TSXAir must be called with a single (function) argument', 'code');
    }
    let name;
    try {
        name = safely(() =>
            // @ts-ignore
            asCode(astNode.parent.name),
            `Components name must start with a capital letter`,
            i => /^[A-Z].*/.test(i));
    } catch (e) {
        return errorNode<CompDefinition>(astNode, e.message, 'code');
    }


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

    const tsxAir: CompDefinition = {
        kind: 'CompDefinition',
        name,
        propsIdentifier,
        aggregatedVariables,
        variables,
        volatileVariables,
        sourceAstNode: astNode,
        jsxRoots: jsxRoots(astNode, propsIdentifier),
        functions: functions(compFunc.body),
        stores
    };
    const astToTsxAir = aggregateAstNodeMapping(tsxAir.jsxRoots);
    addToNodesMap(astToTsxAir, tsxAir);
    return {
        tsxAir,
        astToTsxAir
    } as AnalyzerResult<CompDefinition>;
};
