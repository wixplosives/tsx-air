import { parseStatement } from './../astUtils/parser';
import { generateDomBindings } from './generators/component-common';
import { compFactory } from './generators/component-factory';
import { Transformer } from './index';
import ts from 'typescript';
import { compClass } from './generators/component-class';
import { analyze } from '../analyzers';
import { TsxFile } from '../analyzers/types';
(window as any).ts = ts;

export const tsxAir: Transformer = {
    name: 'TSXAir',
    description: 'Transpiles TSXAir() declarations',
    requires: [],
    transformer: (context: ts.TransformationContext): ts.Transformer<ts.SourceFile> => {
        return sourceFile => {
            const sourceData = analyze(sourceFile) as TsxFile;
            return ts.visitEachChild(sourceFile, transformTsxAir, context);

            function transformTsxAir(n: ts.Node): ts.Node | ts.Node[] {
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
                console.log(output);

                return  parseStatement(
                        output
                    )
                ;
            }
        };
    }
};