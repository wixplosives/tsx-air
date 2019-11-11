import ts from 'typescript';
import { Analyzer, TsxFile, CompDefinition } from './types';
import { compDefinition } from './comp-definition';
import { scan } from '../astUtils/scanner';
import { hasError, errorNode, isTsxAirNode, addToNodesMap, NodesMap } from './types.helpers';

export const analyzeFile: Analyzer<ts.SourceFile, TsxFile> = node => {
    if (ts.isSourceFile(node)) {
        const astToTsxAir: NodesMap = new Map();
        const tsxAir: TsxFile = {
            kind: 'file',
            compDefinitions: scan(node, (n, { ignoreChildren }) => {
                if (ts.isSourceFile(n)) {
                    return;
                }
                const analyzed = analyze(n);
                if (isTsxAirNode(analyzed.tsxAir) && !hasError(analyzed.tsxAir)) {
                    ignoreChildren();
                    addToNodesMap(astToTsxAir, analyzed.astToTsxAir);
                    return analyzed.tsxAir;
                }
                return;
            }).map(i => i.metadata as unknown as CompDefinition),
            sourceAstNode: node
        };
        return {
            tsxAir, astToTsxAir
        };
    }

    return errorNode(node, 'Not a source file');
};

export const analyze: Analyzer = node => {
    if (!node) {
        return errorNode(node, 'undefined or null node', 'internal');
    }

    const comp = compDefinition(node);
    if (isTsxAirNode(comp.tsxAir) && !hasError(comp.tsxAir)) {
        return comp;
    }

    return errorNode(node, 'Unidentified node', 'unsupported');
};