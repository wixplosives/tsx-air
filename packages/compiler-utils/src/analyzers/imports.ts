import { Analyzer, Import, ImportSpecifierInfo } from './types';
import ts from 'typescript';
import { asAnalyzerResult, errorNode, filterResults } from './types.helpers';
import { scan } from '../ast-utils/scanner';

export const importStatement: Analyzer<Import> = sourceAstNode => {
    if (ts.isImportDeclaration(sourceAstNode)) {
        const module = sourceAstNode.moduleSpecifier.getText();
        const specifiers = scan(sourceAstNode, importSpecifierStatement);
        const specifiersInfo = filterResults(specifiers);
        let defaultLocalName: string | undefined;
        let nameSpace: string | undefined;
        if (sourceAstNode.importClause) {
            const imports = sourceAstNode.importClause;
            const bindings = imports.namedBindings;
            if (sourceAstNode.importClause.name) {
                defaultLocalName = sourceAstNode.importClause.name.getText();
            } 
            if (bindings && ts.isNamespaceImport(bindings)) {
                nameSpace = bindings.name.getText();
            }
        }

        return asAnalyzerResult<Import>({
            kind: 'import',
            imports: specifiersInfo,
            defaultLocalName,
            nameSpace,
            module: module.substr(1, module.length - 2),
            sourceAstNode
        });
    }
    return errorNode(sourceAstNode, 'No an import statement', 'internal');
};

export const importSpecifierStatement: Analyzer<ImportSpecifierInfo> = sourceAstNode => {
    if (ts.isImportSpecifier(sourceAstNode)) {
        const importedName = sourceAstNode.propertyName ? sourceAstNode.propertyName.getText() : sourceAstNode.name.getText();
        const localName = sourceAstNode.name.getText();
        return asAnalyzerResult<ImportSpecifierInfo>({
            kind: 'importSpecifier',
            sourceAstNode,
            externalName: importedName,
            localName
        });
    }
    return errorNode(sourceAstNode, 'No an import statement', 'internal');
};