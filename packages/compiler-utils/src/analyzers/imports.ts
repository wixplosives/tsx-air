import { Analyzer, Import, ImportSpecifierInfo } from './types';
import ts from 'typescript';
import { asAnalyzerResult, errorNode, filterResults } from './types.helpers';
import { scan } from '../ast-utils/scanner';
import { asCode } from '..';

export const importStatement: Analyzer<Import> = sourceAstNode => {
    if (ts.isImportDeclaration(sourceAstNode)) {
        const module = asCode(sourceAstNode.moduleSpecifier);
        const specifiers = scan(sourceAstNode, importSpecifierStatement);
        const specifiersInfo = filterResults(specifiers);
        let defaultLocalName: string | undefined;
        let nameSpace: string | undefined;
        if (sourceAstNode.importClause) {
            const imports = sourceAstNode.importClause;
            const bindings = imports.namedBindings;
            if (sourceAstNode.importClause.name) {
                defaultLocalName = asCode(sourceAstNode.importClause.name);
            } 
            if (bindings && ts.isNamespaceImport(bindings)) {
                nameSpace = asCode(bindings.name);
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
        const importedName = sourceAstNode.propertyName ? asCode(sourceAstNode.propertyName) : asCode(sourceAstNode.name);
        const localName = asCode(sourceAstNode.name);
        return asAnalyzerResult<ImportSpecifierInfo>({
            kind: 'importSpecifier',
            sourceAstNode,
            externalName: importedName,
            localName
        });
    }
    return errorNode(sourceAstNode, 'No an import statement', 'internal');
};