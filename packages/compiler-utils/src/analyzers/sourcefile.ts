import { TsxFile, Analyzer } from './types';
import ts from 'typescript';
import { analyze } from '.';
import { addToNodesMap, NodesMap, errorNode } from './types.helpers';
import { scan } from '../ast-utils/scanner';
import { isTsxAirNode, hasError, isCompDefinition, isImport, isReExport, isHookDef } from './types.is.type';

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

        /// TODO discuss with Nadav
        const tsxAir: TsxFile = {
            kind: 'file',
            compDefinitions: nodesOfInterest.filter(isCompDefinition),
            sourceAstNode: node,
            imports: nodesOfInterest.filter(isImport),
            reExports: nodesOfInterest.filter(isReExport),
            variables: {
                accessed: {},
                modified: {},
                defined: {},
                executed: {},
                read: {}
            },
            aggregatedVariables: {
                accessed: {},
                modified: {},
                defined: {},
                executed: {},
                read: {}
            },
            hooks: nodesOfInterest.filter(isHookDef)
        };
        return {
            tsxAir,
            astToTsxAir
        };
    }

    return errorNode(node, 'Not a source file', 'internal');
};
