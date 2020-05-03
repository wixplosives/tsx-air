import ts from 'typescript';
import { find } from './scanner';
import isString from 'lodash/isString';
import { cloneDeep } from '.';

export const asSourceFile = (statement: string, filename = 'mock.ts') =>
    ts.createSourceFile(filename, statement, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

/**
 * 
 * @param obj a stringified js object
 * @returns Ast node of {obj}
 */
export const parseValue = (obj: string | object) => {
    const mockFileContent = `export const frag = ${isString(obj) ? obj : JSON.stringify(obj)}`;
    const mockFile = asSourceFile(mockFileContent);
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


export function asAst(statement: string, returnStatement:true): ts.Statement;
export function asAst(statement: string, returnStatement?:boolean): ts.Node;
export function asAst(statement: string, returnStatement = false) {
    const mockFile = asSourceFile(statement);

    const validValue = returnStatement
        ? mockFile.statements[0]
        : mockFile.statements[0].getChildAt(0);

    if (validValue &&
        !(validValue.flags & ts.NodeFlags.ThisNodeHasError)) {
        return returnStatement
            ? validValue
            : cloneDeep(validValue) as ts.Node;
    }
    throw new Error('Invalid value object');
}