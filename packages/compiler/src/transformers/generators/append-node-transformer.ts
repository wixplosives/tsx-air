import ts from 'typescript';
import { cObject } from './ast-generators';
import { TsxFile } from '../../analyzers/types';
import { analyze } from '../../analyzers';


export interface GeneratorContext {
    appendPrivateVar(wantedName: string, expression: ts.Expression): ts.Expression;
    getScanRes():TsxFile;
}
export type GeneratorTransformer = (genCtx: GeneratorContext, ctx: ts.TransformationContext) => ts.Transformer<ts.Node>;

const varHolderIdentifier = '__private_tsx_air__';
export const appendNodeTransformer: (gen: GeneratorTransformer) => ts.TransformerFactory<ts.SourceFile> = gen => ctx => {
    const appendedNodes: Record<string, ts.Expression> = {};
    let scanRes:TsxFile;
    const genCtx: GeneratorContext = {
        appendPrivateVar(wantedName, exp) {
            let counter = 0;
            while (appendedNodes[wantedName + counter]) {
                counter++;
            }
            appendedNodes[wantedName + counter] = exp;
            return ts.createPropertyAccess(ts.createIdentifier(varHolderIdentifier), ts.createIdentifier(wantedName + counter));
        },
        getScanRes(){
            return scanRes;
        }
    };


    return (node: ts.SourceFile) => 
    {
        scanRes = analyze(node) as any;
        const res = ts.visitEachChild(node, gen(genCtx, ctx), ctx);
        const varHolder = ts.createVariableStatement(undefined, [ts.createVariableDeclaration(varHolderIdentifier, undefined, cObject(appendedNodes))]);
        return ts.updateSourceFileNode(node, res.statements.concat([varHolder]));
    };
};