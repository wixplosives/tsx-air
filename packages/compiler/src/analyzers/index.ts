import { TsxAirNode, Analyzer } from './types';
import * as ts from 'typescript';
import { find } from '../astUtils/scanner';
import { tsxair } from '../visitors/tsxair';
import { compDefinition } from './comp-definition';

export const  analyze:Analyzer<> (node: ts.Node): TsxAirNode<ts.Node> {
    if (!node) {
        return {
            sourceAstNode: node,
            kind: 'error',
            errors: [{
                message: 'undefined or null node',
                type: 'internal'
            }]
        };
    }

    const tsx = find(node, tsxair);
    if (tsx) {
        return compDefinition(node);
    }

    return {
        sourceAstNode: node,
        kind: 'error',
        errors: [{
            message: 'unidentified node',
            type: 'internal'
        }]
    };
} 