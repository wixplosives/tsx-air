import { Transformer } from './index';
import { parseValue } from '../astUtils/parser';
import { tsxair } from '../visitors/jsx';
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
                        node.parent.parent === n);
                if (tsxAirCall) {
                    return parseValue(`class ${tsxAirCall.note.name}{

                    }`);
                } else {
                    return ts.visitEachChild(n, transformTsxAir, context);
                }
            }
        };
    }
};
