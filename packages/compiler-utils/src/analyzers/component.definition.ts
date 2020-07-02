import { asCode } from '..';
import { CompDefinition, Analyzer, AnalyzerResult, Return } from './types';
import ts from 'typescript';
import { jsxRoots } from './jsxroot';
import { errorNode, aggregateAstNodeMapping, addToNodesMap } from './types.helpers';
import { findUsedVariables } from './find-used-variables';
import { functions } from './func-definition';
import { getStoresDefinitions } from './store-definition';
import { isTsFunction, isTsJsxRoot } from './types.is.type';
import { safely } from '@tsx-air/utils/src';
import { isArray } from 'lodash';

export const compDefinition: Analyzer<CompDefinition> = astNode => {
    if (!ts.isCallExpression(astNode) || astNode.expression.getText() !== 'TSXAir') {
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
    const returns = findReturns(compFunc);

    const tsxAir: CompDefinition = {
        kind: 'CompDefinition',
        name,
        propsIdentifier,
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
    } as AnalyzerResult<CompDefinition>;
};

function* findStatementReturns(statement?: ts.Node | ts.Node[] | ts.NodeArray<ts.Node>):Generator<Return> {
    if (isArray(statement)) {
        for (const s of statement) {
            yield* findStatementReturns(s);
        }
    } else {
        switch ((statement as ts.Node)?.kind) {
            case ts.SyntaxKind.IfStatement:
                const ifs = statement as ts.IfStatement;
                yield* findStatementReturns(ifs.thenStatement);
                yield* findStatementReturns(ifs.elseStatement);
                break;

            case ts.SyntaxKind.SwitchStatement:
                const switches = statement as ts.SwitchStatement;
                for (const clause of switches.caseBlock.clauses) {
                    yield* findStatementReturns(clause.statements);
                }
                break;

            case ts.SyntaxKind.DoStatement:
            case ts.SyntaxKind.WhileStatement:
            case ts.SyntaxKind.ForStatement:
            case ts.SyntaxKind.ForInStatement:
            case ts.SyntaxKind.ForOfStatement:
                yield* findStatementReturns((statement as ts.ForStatement).statement);
                break;

            case ts.SyntaxKind.Block:
                yield* findStatementReturns((statement as ts.Block).statements);
                break;

            case ts.SyntaxKind.ReturnStatement:
                const ret = statement as ts.ReturnStatement;
                yield {
                    kind: 'Return',
                    sourceAstNode: ret,
                    parentStatement: ret,
                    value: ret.expression
                        ? asCode(ret.expression)
                        : 'undefined'
                };
                break;
        }
    }
}

function findReturns(comp: ts.FunctionLikeDeclaration): Return[] {
    if (!comp.body) {
        throw new Error(`Invalid component`);
    }
    return [...findStatementReturns(comp.body)];
}