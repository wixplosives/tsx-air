import ts from 'typescript';
import { TsxFile, TsNodeToAirNode, AnalyzerResult } from '../../analyzers/types';
import { analyze } from '../../analyzers';
import { cObject, cAccess, cImport, ImportDefinition } from '.';
import { asCode, asString } from '../..';
import { uniqBy } from 'lodash';


export interface FileTransformerAPI {
    prependStatements(...statements: ts.Statement[]): void;
    appendStatements(...statements: ts.Statement[]): void;
    appendPrivateVar(wantedName: string, expression: ts.Expression): ts.Expression;
    ensureImport(importedName: string, fromModule: string): ts.Expression;
    ensureDefaultImport(localName: string, fromModule: string): ts.Expression;
    removeImport(fromModule: string): void;
    swapImport(fromModule: string, toModule: string, remove: string[]): void;
    getAnalyzed(): TsxFile;
    tsNodeToAirNodes<T extends ts.Node>(node: T): Array<TsNodeToAirNode<T>> | undefined;
}

const varHolderIdentifier = '__private_tsx_air__';
const contextMap: WeakMap<ts.SourceFile, FileTransformerAPI> = new WeakMap();
export const transformerApiProvider: (gen: ts.TransformerFactory<ts.Node>) => ts.TransformerFactory<ts.SourceFile> = gen => ctx => {
    return (node: ts.SourceFile) => {
        const addedPrivateVars: Record<string, ts.Expression> = {};
        let appendedStatements: ts.Statement[] = [];
        let prependedStatements: ts.Statement[] = [];
        const addedImports: Record<string, ImportDefinition> = {};
        const removedImports = new Set<string>();
        const swapImports = new Map<string, { toModule: string, remove: string[] }>();
        let scanRes: AnalyzerResult<TsxFile>;
        const genCtx: FileTransformerAPI = {
            appendPrivateVar(wantedName, exp) {
                let counter = 0;
                while (addedPrivateVars[wantedName + counter]) {
                    counter++;
                }
                addedPrivateVars[wantedName + counter] = exp;
                return ts.createPropertyAccess(ts.createIdentifier(varHolderIdentifier), ts.createIdentifier(wantedName + counter));
            },
            getAnalyzed() {
                return scanRes.tsxAir as any;
            },
            tsNodeToAirNodes(n) {
                return scanRes.astToTsxAir.get(n) as any;
            },
            appendStatements(...statements: ts.Statement[]) {
                appendedStatements.push(...statements);
                appendedStatements = uniqBy(appendedStatements, s => asCode(s));
            },
            prependStatements(...statements: ts.Statement[]) {
                prependedStatements.push(...statements);
                prependedStatements = uniqBy(prependedStatements, s => asCode(s));
            },
            ensureImport(importedName, fromModule) {
                const existingModule = addedImports[fromModule];
                if (existingModule) {
                    const existingImport = existingModule.exports.find(exp => exp.importedName === importedName);
                    if (existingImport) {
                        return cAccess(existingImport.localName || existingImport.importedName);
                    }
                    addedImports[fromModule].exports.push({
                        importedName
                    });
                    return cAccess(importedName);
                }
                addedImports[fromModule] = {
                    modulePath: fromModule,
                    exports: [
                        {
                            importedName
                        }
                    ]
                };
                return cAccess(importedName);
            },
            ensureDefaultImport(localName, fromModule) {
                const existingModule = addedImports[fromModule];
                if (existingModule) {
                    if (existingModule.defaultLocalName) {
                        return cAccess(existingModule.defaultLocalName);
                    }
                    existingModule.defaultLocalName = localName;
                    return cAccess(localName);
                }
                addedImports[fromModule] = {
                    modulePath: fromModule,
                    defaultLocalName: localName,
                    exports: []
                };
                return cAccess(localName);
            },
            removeImport(fromModule) {
                removedImports.add(fromModule);
            },
            swapImport(fromModule, toModule, remove = []) {
                swapImports.set(fromModule, { toModule, remove });
            }
        };
        contextMap.set(node, genCtx);
        scanRes = analyze(node) as AnalyzerResult<TsxFile>;
        // const fileRes = scanRes.tsxAir as TsxFile;
        // fileRes.imports[0].
        const res = ts.visitEachChild(node, gen(ctx), ctx);
        let allStatements = (res.statements as any as ts.Statement[])
            .map(s => swapImportStatement(s, swapImports, removedImports)).filter(i => !!i);

        if (Object.keys(addedPrivateVars).length !== 0) {
            const varHolder: ts.Statement = ts.createVariableStatement(undefined, [ts.createVariableDeclaration(varHolderIdentifier, undefined, cObject(addedPrivateVars))]);
            allStatements = [varHolder].concat(allStatements);
        }
        if (prependedStatements.length) {
            allStatements = prependedStatements.concat(allStatements);
        }
        const addImportedModules = Object.keys(addedImports);
        for (const addModuleName of addImportedModules) {
            allStatements.unshift(cImport(addedImports[addModuleName]));
        }
        if (appendedStatements.length) {
            allStatements = allStatements.concat(appendedStatements);
        }
        contextMap.delete(node);
        return ts.updateSourceFileNode(node, allStatements);
    };
};

const swapImportStatement = (s: ts.Statement, swapImports: Map<string, any>, removedImports:Set<string>) => {
    if (ts.isImportDeclaration(s)) {
        if (removedImports.has(asString(s.moduleSpecifier))) {
            return null as any as ts.Statement;
        }
        const substitute = swapImports.get(asString(s.moduleSpecifier));
        if (substitute) {
            const bindings = s.importClause?.namedBindings && ts.isNamedImports(s.importClause?.namedBindings)
                && s.importClause?.namedBindings.elements.filter(
                    i => !substitute.remove.includes(asString(i.name))
                );

            if (bindings && bindings.length === 0) {
                return null as any as ts.Statement;
            }

            const importClause = bindings
                ? ts.createImportClause(s.importClause?.name, ts.createNamedImports(bindings))
                : s.importClause;

            return ts.createImportDeclaration(
                s.decorators, s.modifiers, importClause, ts.createStringLiteral(substitute.toModule));
        }
    }
    return s;
};

export const getFileTransformationAPI = (file: ts.SourceFile) => {
    const res = contextMap.get(file);
    if (!res) {
        throw new Error(' context does not exist ');
    }
    return res;
};
