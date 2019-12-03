import * as ts from 'typescript';
import { Analyzer, FuncDefinition } from './types';
import { errorNode, aggregateAstNodeMapping, addToNodesMap } from './types.helpers';
import { findAccessedMembers } from './find-accessed';

export const funcDefinition: Analyzer<FuncDefinition> = astNode => {
    if (!ts.isArrowFunction(astNode) || ts.isFunctionExpression(astNode)) {
        return errorNode<FuncDefinition>(astNode, 'Not a function definition', 'internal');
    }

    const members = findAccessedMembers(astNode);
    const deepMembers = findAccessedMembers(astNode, true);

    const funcDef: FuncDefinition = {
        kind: 'funcDefinition',
        name: ts.isVariableDeclaration(astNode.parent) ? astNode.parent.name.getText() : undefined,
        sourceAstNode: astNode,
        members,
        deepMembers,
        definedFunctions: [],
        arguments: [],
        jsxRoots: []
    };
    const astToTsxAir = aggregateAstNodeMapping(funcDef.jsxRoots);
    addToNodesMap(astToTsxAir, funcDef);
    return {
        tsxAir: funcDef,
        astToTsxAir
    };
};

