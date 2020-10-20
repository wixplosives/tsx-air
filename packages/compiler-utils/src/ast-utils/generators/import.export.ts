import { cLiteralAst } from '.';
import ts from 'typescript';

export interface ImportSpecifierDef {
    localName?: string;
    importedName: string;
}

export interface ImportDefinition {
    modulePath: string;
    exports: ImportSpecifierDef[];
    defaultLocalName?: string;
}

export const cImport = (module: string, imports: ImportSpecifierDef[]) => {
    return ts.createImportDeclaration(undefined, undefined,
        ts.createImportClause(undefined,
            ts.createNamedImports(imports.map(exp => ts.createImportSpecifier(exp.localName ? ts.createIdentifier(exp.importedName) : undefined, exp.localName ? ts.createIdentifier(exp.localName) : ts.createIdentifier(exp.importedName))))
        ), cLiteralAst(module));
};
