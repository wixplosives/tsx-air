
interface ImportSpecifierDef {
    localName?: string;
    importedName: string;
}

export interface ImportDefinition {
    modulePath: string;
    exports: ImportSpecifierDef[];
    defaultLocalName?: string;
}

export const cImport = (info: ImportDefinition) => {
    return ts.createImportDeclaration(undefined, undefined,
        ts.createImportClause(
            info.defaultLocalName ? ts.createIdentifier(info.defaultLocalName) : undefined,
            info.exports.length ? ts.createNamedImports(info.exports.map(exp => ts.createImportSpecifier(exp.localName ? ts.createIdentifier(exp.importedName) : undefined, exp.localName ? ts.createIdentifier(exp.localName) : ts.createIdentifier(exp.importedName)))) : undefined
        ), cLiteralAst(info.modulePath));
};
