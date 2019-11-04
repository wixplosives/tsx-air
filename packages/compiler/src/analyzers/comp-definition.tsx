import * as ts from 'typescript';
import { CompDefinition, Analyzer } from './types';
import { isCallExpression } from 'typescript';

export const compDefinition: Analyzer<ts.CallExpression, CompDefinition> = astNode => {
    if (!isCallExpression(astNode)) {
        return;
    }
    
    return;
};