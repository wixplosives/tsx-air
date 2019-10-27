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
            const jsxs = scan(sourceFile, tsxair).filter(({ note }) => note === '/* Jsx */');
            return ts.visitEachChild(sourceFile, transformTsxAir, context);

            function transformTsxAir(n: ts.Node): ts.Node | ts.Node[] {

                const jsxItem = jsxs.find(
                    ({ node }) =>
                        node === n);
                if (jsxItem) {
                    return parseValue(`TSXAir.createElement(FRAGMENT_CHECKBOX_a, {})`);
                } else {
                    return ts.visitEachChild(n, transformTsxAir, context);
                }
            }
        };
    }
};
