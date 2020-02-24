import { Analyzer, ExportSpecifierInfo, ReExport } from './types';
import ts from 'typescript';
import { asAnalyzerResult, errorNode, filterResults } from './types.helpers';
import { scan } from '../ast-utils/scanner';

export const exportStatement: Analyzer<ReExport> = sourceAstNode => {
    if (ts.isExportDeclaration(sourceAstNode) && sourceAstNode.moduleSpecifier) {
        const module = sourceAstNode.moduleSpecifier.getText();
        if (module === 'as') {
            return errorNode(sourceAstNode, 'Export * as xxx statements are not supported by typescript', 'not supported yet');
        }
        const specifiers = scan(sourceAstNode, namedExports);
        const specifiersInfo = filterResults(specifiers);

        return asAnalyzerResult<ReExport>({
            kind: 'reExport',
            exports: specifiersInfo?.length > 0 ? specifiersInfo : undefined,
            module: module.substr(1, module.length - 2),
            sourceAstNode
        });
    }
    return errorNode(sourceAstNode, 'No a re-export statement', 'internal');
};

export const namedExports: Analyzer<ExportSpecifierInfo> = sourceAstNode => {
    if (ts.isExportSpecifier(sourceAstNode)) {
        const externalName = sourceAstNode.propertyName ? sourceAstNode.propertyName.getText() : sourceAstNode.name.getText();
        const localName = sourceAstNode.name.getText();
        return asAnalyzerResult<ExportSpecifierInfo>({
            kind: 'exportSpecifier',
            sourceAstNode,
            externalName,
            localName
        });
    }
    return errorNode(sourceAstNode, 'No an import statement', 'internal');
};