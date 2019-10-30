import { findDomBindings } from './generators/component-common';
import { toString, hydrate } from './generators/component-factory';
import { Transformer } from './index';
import { parseValue } from '../astUtils/parser';
import { tsxair, TSXAirData } from '../visitors/tsxair';
import ts from 'typescript';
import { scan } from '../astUtils/scanner';
import { compClass } from './generators/component-class';
(window as any).ts = ts;

export const jsx: Transformer = {
    name: 'Jsx',
    description: 'Transpiles Jsx to fragments',
    requires: [],
    transformer: (context: ts.TransformationContext): ts.Transformer<ts.SourceFile> => {
        return sourceFile => {
            const scanRes = scan(sourceFile, tsxair);
            const tsxAirs = scanRes.filter(({ metadata: note }) => note.kind === 'TSXAIR');
            return ts.visitEachChild(sourceFile, transformTsxAir, context);

            function transformTsxAir(n: ts.Node): ts.Node | ts.Node[] {

                const tsxAirCall = tsxAirs.find(
                    ({ node }) =>
                        node === n);
                if (tsxAirCall) {
                    const dom = findDomBindings(tsxAirCall.node);
                    const { metadata: { name } } = tsxAirCall;
                    return parseValue(`(()=>{
    ${compClass(dom, tsxAirCall.metadata)}
    ${name}.changeBitmask={${(tsxAirCall.metadata as TSXAirData).usedProps.map((prop, i) => `${prop}:1<<${i}`).join()}}
    ${name}.factory={
        unique: Symbol('${name}'),
        toString:${toString(tsxAirCall.node, tsxAirCall.metadata)},
        hydrate:${hydrate(tsxAirCall.metadata, dom)},
        initialState: () => ({})
    };
    return ${tsxAirCall.metadata.name};})()`);
                } else {
                    return ts.visitEachChild(n, transformTsxAir, context);
                }
            }
        };
    }
};

