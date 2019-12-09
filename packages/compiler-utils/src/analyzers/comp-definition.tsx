import * as ts from 'typescript';
import { CompDefinition, Analyzer, CompProps, AnalyzerResult, isTSJSXRoot, isTSFunction } from './types';
import { isCallExpression, PropertyAccessExpression } from 'typescript';
import uniqBy from 'lodash/uniqBy';
import { scan } from '../astUtils/scanner';
import { jsxRoots } from './jsxroot';
import { errorNode, aggregateAstNodeMapping, addToNodesMap } from './types.helpers';
import { findUsedVariables } from './find-used-variables';
import { functions } from './func-definition';


export const compDefinition: Analyzer<CompDefinition> = astNode => {
    if (!isCallExpression(astNode) || astNode.expression.getText() !== 'TSXAir') {
        return errorNode<CompDefinition>(astNode, 'Not a component definition', 'internal');
    }

    const compFunc = astNode.arguments[0];
    if (astNode.arguments.length !== 1 ||
        !(isTSFunction(compFunc))
    ) {
        return errorNode<CompDefinition>(astNode, 'TSXAir must be called with a single (function) argument', 'code');
    }

    const propsIdentifier = compFunc.parameters[0] && compFunc.parameters[0].name ? compFunc.parameters[0].name.getText() : undefined;
    const usedProps = propsIdentifier ? findUsedProps(compFunc, propsIdentifier) || [] : [];

    const variables = findUsedVariables(compFunc, node => isTSJSXRoot(node) || isTSFunction(node));
    const agregatedVariables = findUsedVariables(compFunc);
    const tsxAir: CompDefinition = {
        kind: 'CompDefinition',
        name: ts.isVariableDeclaration(astNode.parent) ? astNode.parent.name.getText() : undefined,
        propsIdentifier,
        usedProps,
        agregatedVariables,
        variables,
        sourceAstNode: astNode,
        jsxRoots: jsxRoots(astNode, propsIdentifier, usedProps),
        functions: functions(compFunc.body)
    };
    const astToTsxAir = aggregateAstNodeMapping(tsxAir.jsxRoots);
    addToNodesMap(astToTsxAir, tsxAir);
    return {
        tsxAir,
        astToTsxAir
    } as AnalyzerResult<CompDefinition>;
};

const findUsedProps = (node: ts.Node, name: string) => uniqBy(
    scan(node, n => {
        if (ts.isPropertyAccessExpression(n) && n.expression.getText() === name) {
            return n.name.getText();
        }
        return;
    }).map<CompProps>(i => ({
        kind: 'CompProps',
        name: i.metadata,
        sourceAstNode: (i.node as PropertyAccessExpression).name
    })), 'name');

