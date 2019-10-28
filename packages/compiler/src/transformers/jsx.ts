import { toString } from './generators/component-factory';
import { Transformer } from './index';
import { parseValue } from '../astUtils/parser';
import { tsxair, TSXAirData } from '../visitors/tsxair';
import ts from 'typescript';
import { scan } from '../astUtils/scanner';
(window as any).ts = ts;

export const jsx: Transformer = {
    name: 'Jsx',
    description: 'Transpiles Jsx to fragments',
    requires: [],
    transformer: (context: ts.TransformationContext): ts.Transformer<ts.SourceFile> => {
        return sourceFile => {
            const scanRes = scan(sourceFile, tsxair);
            const tsxAirs = scanRes.filter(({ note }) => note.kind === 'TSXAIR');
            return ts.visitEachChild(sourceFile, transformTsxAir, context);

            function transformTsxAir(n: ts.Node): ts.Node | ts.Node[] {

                const tsxAirCall = tsxAirs.find(
                    ({ node }) =>
                        node === n);
                if (tsxAirCall) {
                    const { note: { name } } = tsxAirCall;
                    return parseValue(`(()=>{
    class ${name}{
    }
    ${name}.changeBitmask={${(tsxAirCall.note as TSXAirData).usedProps.map((name, i) => `${name}:1<<${i}`).join()}}
    ${name}.factory={
        unique: Symbol('${name}'),
        toString:${toString(tsxAirCall.node, tsxAirCall.note)},
        hydrate:(root, props)=> new ${name}({
            root
        }, props, {}),
        initialState: () => ({})
    };
    return ${tsxAirCall.note.name};})()`);
                } else {
                    return ts.visitEachChild(n, transformTsxAir, context);
                }
            }
        };
    }
};



