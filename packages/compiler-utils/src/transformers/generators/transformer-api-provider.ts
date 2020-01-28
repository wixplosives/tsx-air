import ts from 'typescript';
import { TsxFile, TsNodeToAirNode, AnalyzerResult } from '../../analyzers/types';
import { analyze } from '../../analyzers';
import { cObject, cAccess, cImport, ImportDefinition } from './ast-generators';


export interface FileTransformerAPI {
    prependStatements(...statements: ts.Statement[]): void;
    appendStatements(...statements: ts.Statement[]): void;
    appendPrivateVar(wantedName: string, expression: ts.Expression): ts.Expression;
    ensureImport(importedName: string, fromModule: string): ts.Expression;
    ensureDefaultImport(localName: string, fromModule: string): ts.Expression;
    getAnalayzed(): TsxFile;
    tsNodeToAirNodes<T extends ts.Node>(node: T): Array<TsNodeToAirNode<T>> | undefined;
}


const varHolderIdentifier = '__private_tsx_air__';
const contextMap: WeakMap<ts.SourceFile, FileTransformerAPI> = new WeakMap();
export const transfromerApiProvider: (gen: ts.TransformerFactory<ts.Node>) => ts.TransformerFactory<ts.SourceFile> = gen => ctx => {
    return (node: ts.SourceFile) => {
        const appendedNodes: Record<string, ts.Expression> = {};
        const appendedStatements: ts.Statement[] = [];
        const prependedStatements: ts.Statement[] = [];
        const addedImports: Record<string, ImportDefinition> = {};
        let scanRes: AnalyzerResult<TsxFile>;
        const genCtx: FileTransformerAPI = {
            appendPrivateVar(wantedName, exp) {
                let counter = 0;
                while (appendedNodes[wantedName + counter]) {
                    counter++;
                }
                appendedNodes[wantedName + counter] = exp;
                return ts.createPropertyAccess(ts.createIdentifier(varHolderIdentifier), ts.createIdentifier(wantedName + counter));
            },
            getAnalayzed() {
                return scanRes.tsxAir as any;
            },
            tsNodeToAirNodes(n) {
                return scanRes.astToTsxAir.get(n) as any;
            },
            appendStatements(...statements: ts.Statement[]) {
                appendedStatements.push(...statements);
            },
            prependStatements(...statements: ts.Statement[]) {
                prependedStatements.push(...statements);
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
            }
        };
        contextMap.set(node, genCtx);
        scanRes = analyze(node) as AnalyzerResult<TsxFile>;
        // const fileRes = scanRes.tsxAir as TsxFile;
        // fileRes.imports[0].
        const res = ts.visitEachChild(node, gen(ctx), ctx);
        let allStatements = res.statements as any as ts.Statement[];
        if (Object.keys(appendedNodes).length !== 0) {
            const varHolder: ts.Statement = ts.createVariableStatement(undefined, [ts.createVariableDeclaration(varHolderIdentifier, undefined, cObject(appendedNodes))]);
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


export const getFileTransformationAPI = (file: ts.SourceFile) => {
    const res = contextMap.get(file);
    if (!res) {
        throw new Error(' context does not exist ');
    }
    return res;
};