import { isCallExpression } from 'typescript';
import {  Analyzer } from './types';
import { compDefinition } from './comp-definition';

export const  analyze:Analyzer = node => {
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

    if (isCallExpression(node)){
        const comp = compDefinition(node);
        if (comp && comp.kind === 'CompDefinition') {
            return comp;
        }
    }

    return {
        sourceAstNode: node,
        kind: 'error',
        errors: [{
            message: 'unidentified node',
            type: 'internal'
        }]
    };
};