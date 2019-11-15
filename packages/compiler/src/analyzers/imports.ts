import { Analyzer, Import } from './types';
import ts from 'typescript';
import { asAnalyzerResult, errorNode } from './types.helpers';

export const importStatement: Analyzer<Import> = sourceAstNode => {
    if (ts.isImportDeclaration(sourceAstNode)) {
        const { importClause, moduleSpecifier } = sourceAstNode;
        const module = moduleSpecifier.getText();

        return asAnalyzerResult({
            kind: 'import',
            imports: importClause ? importClause.getText() : undefined,
            // remove the quotes
            module: module.substr(1, module.length - 2),
            sourceAstNode
        });
    }
    return errorNode(sourceAstNode, 'No an import statement', 'internal');
};