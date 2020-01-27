import { Analyzer, TsxAirNode } from './types';
import { compDefinition } from './component.definition';
import { hasError, errorNode, isTsxAirNode } from './types.helpers';
import { importStatement } from './imports';
import { sourceFile } from './sourcefile';
import { exportStatement } from './re.export';

export const analyze: Analyzer<TsxAirNode> = node => {
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
