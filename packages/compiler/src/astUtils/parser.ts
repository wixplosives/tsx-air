import ts from 'typescript';
import { find } from './scanner';
import { isString } from 'lodash';

/**
 * 
 * @param obj a stringified js object
 * @returns Ast node of {obj}
 */
export const parseLiteral = (obj: string | object) => {
    const mockFileContent = `export const frag = ${isString(obj) ? obj : JSON.stringify(obj)}`;
    const mockFile = ts.createSourceFile('mock.ts', mockFileContent, ts.ScriptTarget.Latest);
    const def = find(mockFile, nd => {
        if (ts.isVariableDeclaration(nd) && ts.isIdentifier(nd.name) && nd.name.escapedText === 'frag') {
            return 'Literal';
        }
        return undefined;
    }) as ts.VariableDeclaration;

    const literal = def && def.initializer &&
        ts.isObjectLiteralExpression(def.initializer) && def.initializer as ts.ObjectLiteralExpression;

    if (literal &&
        // tslint:disable-next-line: no-bitwise
        !(literal.flags & ts.NodeFlags.ThisNodeHasError)) {
        return literal;
    }
    throw new Error('Invalid literal object');
};