import { compFactory } from './component-factory';
import ts from 'typescript';
import { compClass } from './component-class';
import { NamedCompiler } from '../types';
import { TsxFile, analyze, generateDomBindings, cloneDeep, parseValue } from '@wixc3/tsx-air-compiler-utils';

export const tsxAir = (context: ts.TransformationContext): ts.Transformer<ts.SourceFile> => {
    return sourceFile => {
        const sourceData = analyze(sourceFile).tsxAir as TsxFile;
        return ts.visitEachChild(sourceFile, transformTsxAir, context);

        function transformTsxAir(n: ts.Node): ts.Node {
            const tsxAirCall = sourceData.compDefinitions.find(i => {
                return i.sourceAstNode === n;
            });
            if (!tsxAirCall) {
                return ts.visitEachChild(n, transformTsxAir, context);
            }
            const dom = generateDomBindings(tsxAirCall);
            const output = `(()=>{
                            ${compClass(dom, tsxAirCall)}
                            ${compFactory(dom, tsxAirCall)}
                            return ${tsxAirCall.name};
                        })()`;

            return cloneDeep(parseValue(output));
        }
    };
};
const compiler: NamedCompiler = {
    name: 'String Based Compiler',
    transformers: {
        before: [tsxAir]
    }
};
export default compiler;