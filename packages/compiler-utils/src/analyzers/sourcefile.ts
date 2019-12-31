import { TsxFile, Analyzer, isCompDefinition, isImport, isReExport } from './types';
import ts from 'typescript';
import { analyze } from '.';
import { isTsxAirNode, addToNodesMap, hasError, NodesMap, errorNode } from './types.helpers';
import { scan } from '../astUtils/scanner';

export const sourceFile: Analyzer<TsxFile> = node => {
    if (ts.isSourceFile(node)) {
        const astToTsxAir: NodesMap = new Map();
        const nodesOfInterest = scan(node, (n, { ignoreChildren }) => {
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
        }).map(i => i.metadata);

        const tsxAir: TsxFile = {
            kind: 'file',
            compDefinitions: nodesOfInterest.filter(isCompDefinition),
            sourceAstNode: node,
            imports: nodesOfInterest.filter(isImport),
            reExports: nodesOfInterest.filter(isReExport)
        };
        return {
            tsxAir, astToTsxAir
        };
    }

    return errorNode(node, 'Not a source file', 'internal');
};