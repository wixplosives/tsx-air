import { compFactory } from './component-factory';
import ts from 'typescript';
import { compClass } from './component-class';
import { Compiler, featureWith, feature } from '@tsx-air/types';
import { TsxFile, analyze, generateDomBindings, cloneDeep, parseValue } from '@tsx-air/compiler-utils';

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
const compiler: Compiler = {
    label: 'String Based Compiler',
    transformers: {
        before: [tsxAir]
    },
    features: [
        ...featureWith(feature('component'), 'static', 'stateless'),
        feature('declarative', 'update', 'nested', 'stateless', 'component'),
        feature('imperative', 'update', 'component'),
    ]
};
export default compiler;