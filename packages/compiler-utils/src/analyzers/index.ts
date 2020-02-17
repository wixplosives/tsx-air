import { Analyzer, AnalyzedNode } from './types';
import { compDefinition } from './component.definition';
import {  errorNode } from './types.helpers';
import { importStatement } from './imports';
import { sourceFile } from './sourcefile';
import { exportStatement } from './re.export';
import { isTsxAirNode, hasError } from './types.is.type';

export const analyze: Analyzer<AnalyzedNode> = node => {
    if (!node) {
        return errorNode(node, 'undefined or null node', 'internal');
    }
    const prioritizedAnalyzers = [
        sourceFile,
        importStatement,
        exportStatement,
        compDefinition
    ];

    for (const tryToAnalyze of prioritizedAnalyzers) {
        const detected = tryToAnalyze(node);
        if (isTsxAirNode(detected.tsxAir) && !hasError(detected.tsxAir)) {
            return detected;
        }
    }

    return errorNode(node, 'Unidentified node', 'unsupported');
};

export * from './types';
export * from './find-used-variables';