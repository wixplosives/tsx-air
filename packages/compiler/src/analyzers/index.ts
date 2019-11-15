import { Analyzer, TsxAirNode } from './types';
import { compDefinition } from './comp-definition';
import { hasError, errorNode, isTsxAirNode } from './types.helpers';
import { importStatement } from './imports';
import { sourceFile } from './sourcefile';

export const analyze: Analyzer<TsxAirNode> = node => {
    if (!node) {
        return errorNode(node, 'undefined or null node', 'internal');
    }
    const prioritizedAnalyzers = [
        sourceFile,
        importStatement,
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