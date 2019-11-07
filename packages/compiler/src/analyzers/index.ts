import ts  from 'typescript';
import { Analyzer, TsxFile } from './types';
import { compDefinition } from './comp-definition';
import { scan } from '../astUtils/scanner';


export const analyze:Analyzer = node => {
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

    if (ts.isCallExpression(node)){
        const comp = compDefinition(node);
        if (comp && comp.kind === 'CompDefinition') {
            return comp;
        }
    }

    if (ts.isSourceFile(node)) {
        return {
            kind: 'file',
            compDefinitions: scan(node, (n, { ignoreChildren }) => {
                if (ts.isSourceFile(n)) {
                    return;
                }
                const analyzed = analyze(n);
                if (analyzed && !analyzed.errors) {
                    ignoreChildren();
                    return analyzed;
                }
                return;
            }).map(i => i.metadata as unknown as TsxFile),
            sourceAstNode: node
        };
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