import ts from 'typescript';
import { TsxFile, TsNodeToAirNode, AnalyzerResult } from '../../analyzers/types';
import { analyze } from '../../analyzers';
import { cObject, cAccess, cImport, IImportInfo } from './ast-generators';


export interface FileTransformerAPI {
    prependStatements(...statements: ts.Statement[]): void;
    appendStatements(...statements: ts.Statement[]): void;
    appendPrivateVar(wantedName: string, expression: ts.Expression): ts.Expression;
    ensureImport(importedName: string, fromModule: string): ts.Expression;
    ensureDefaultImport(localName: string, fromModule: string): ts.Expression;
    getAnalayzed(): TsxFile;
    tsNodeToAirNodes<T extends ts.Node>(node: T): Array<TsNodeToAirNode<T>> | undefined;
}

export type GeneratorTransformer = (genCtx: FileTransformerAPI, ctx: ts.TransformationContext) => ts.Transformer<ts.Node>;

const varHolderIdentifier = '__private_tsx_air__';
export const appendNodeTransformer: (gen: GeneratorTransformer) => ts.TransformerFactory<ts.SourceFile> = gen => ctx => {
    const appendedNodes: Record<string, ts.Expression> = {};
    const appendedStatements: ts.Statement[] = [];
    const prependedStatements: ts.Statement[] = [];
    const addedImports: Record<string, IImportInfo> = {};
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
        tsNodeToAirNodes(node) {
            return scanRes.astToTsxAir.get(node) as any;
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


    return (node: ts.SourceFile) => {
        scanRes = analyze(node) as AnalyzerResult<TsxFile>;
        // const fileRes = scanRes.tsxAir as TsxFile;
        // fileRes.imports[0].
        const res = ts.visitEachChild(node, gen(genCtx, ctx), ctx);
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
        return ts.updateSourceFileNode(node, allStatements);
    };
};