import ts from 'typescript';
import { find } from './scanner';
import { isString } from 'lodash';

/**
 * 
 * @param obj a stringified js object
 * @returns Ast node of {obj}
 */
export const parseValue = (obj: string | object) => {
    const mockFileContent = `const frag=${isString(obj) ? obj : JSON.stringify(obj)}`;
    const mockFile = ts.createSourceFile('mock.ts', mockFileContent, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

    const def = find(mockFile, nd => {
        if (ts.isVariableDeclaration(nd) && ts.isIdentifier(nd.name) && nd.name.escapedText === 'frag') {
            return 'Literal';
        }
        return undefined;
    }) as ts.VariableDeclaration;

    const validValue = def && def.initializer;

    if (validValue &&
        !(validValue.flags & ts.NodeFlags.ThisNodeHasError)) {
        return validValue as ts.Node;
    }
    throw new Error('Invalid value object');
};

export const parseStatement = (statement: string) => {
    const mockFileContent = `${isString(statement) ? statement : JSON.stringify(statement)}`;
    const mockFile = ts.createSourceFile('mock.ts', mockFileContent, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

    let validValue:any;
    mockFile.forEachChild(c => validValue = validValue || c);

    if (validValue &&
        !(validValue.flags & ts.NodeFlags.ThisNodeHasError)) {
        return validValue as ts.Node;
    }
    throw new Error('Invalid value object');
};