import ts from 'typescript';
import { TsxFile, tsNodeToAirNode, AnalyzerResult, TsxAirNode } from '../../analyzers/types';
import { analyze } from '../../analyzers';
import { cObject } from './ast-generators';

export interface GeneratorContext {
    prependStatements(...statements: ts.Statement[]): void;
    appendStatements(...statements: ts.Statement[]): void;
    appendPrivateVar(wantedName: string, expression: ts.Expression): ts.Expression;
    getScanRes(): TsxFile;
    getNodeInfo<T extends ts.Node>(node: T): Array<tsNodeToAirNode<T>> | undefined;
}

export type GeneratorTransformer = (genCtx: GeneratorContext, ctx: ts.TransformationContext) => ts.Transformer<ts.Node>;

const varHolderIdentifier = '__private_tsx_air__';
export const appendNodeTransformer: (gen: GeneratorTransformer) => ts.TransformerFactory<ts.SourceFile> = gen => ctx => {
    const appendedNodes: Record<string, ts.Expression> = {};
    const appendedStatements: ts.Statement[] = [];
    const prependedStatements: ts.Statement[] = [];
    let scanRes: AnalyzerResult<TsxAirNode<ts.Node>>;
    const genCtx: GeneratorContext = {
        appendPrivateVar(wantedName, exp) {
            let counter = 0;
            while (appendedNodes[wantedName + counter]) {
                counter++;
            }
            appendedNodes[wantedName + counter] = exp;
            return ts.createPropertyAccess(ts.createIdentifier(varHolderIdentifier), ts.createIdentifier(wantedName + counter));
        },
        getScanRes() {
            return scanRes.tsxAir as any;
        },
        getNodeInfo(node) {
            return scanRes.astToTsxAir.get(node) as any;
        },
        appendStatements(...statements: ts.Statement[]) {
            appendedStatements.push(...statements);
        },
        prependStatements(...statements: ts.Statement[]) {
            prependedStatements.push(...statements);
        }
    };


    return (node: ts.SourceFile) => {
        scanRes = analyze(node);

        const res = ts.visitEachChild(node, gen(genCtx, ctx), ctx);
        let allStatements = res.statements as any as ts.Statement[];
        if (Object.keys(appendedNodes).length !== 0) {
            const varHolder: ts.Statement = ts.createVariableStatement(undefined, [ts.createVariableDeclaration(varHolderIdentifier, undefined, cObject(appendedNodes))]);
            allStatements = [varHolder].concat(allStatements);
        }
        if (prependedStatements.length) {
            allStatements = prependedStatements.concat(allStatements);
        }
        if (appendedStatements.length) {
            allStatements = allStatements.concat(appendedStatements);
        }
        return ts.updateSourceFileNode(node, allStatements);
    };
};