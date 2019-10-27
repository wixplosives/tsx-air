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
            const output = `const output='some js'`;
            return ts.createSourceFile(sourceFile.fileName, output, ts.ScriptTarget.Latest);
        };
    }
};
