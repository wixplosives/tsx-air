import * as ts  from 'typescript';
import { parseValue } from './parser';
import { expect } from 'chai';
import { scan } from './scanner';

describe('parseValue', () => {
    it('should return the AST of a stringified literal object', () => {
        const ast = parseValue(`{
            prop: 'value'
        }`);
        expect(ast.kind).to.equal(ts.SyntaxKind.ObjectLiteralExpression);
        expect(scan(ast, node => node.kind).map(i => i.note)).to.deep.equal([
            ts.SyntaxKind.ObjectLiteralExpression,
            ts.SyntaxKind.PropertyAssignment,
            ts.SyntaxKind.Identifier,
            ts.SyntaxKind.StringLiteral
        ]);
    });
  
    it('should return the AST of a literal object', () => {
        const ast = parseValue({
            prop: 'value'
        });
        expect(ast.kind).to.equal(ts.SyntaxKind.ObjectLiteralExpression);
        expect(scan(ast, node => node.kind).map(i => i.note)).to.deep.equal([
            ts.SyntaxKind.ObjectLiteralExpression,
            ts.SyntaxKind.PropertyAssignment,
            ts.SyntaxKind.StringLiteral,
            ts.SyntaxKind.StringLiteral
        ]);
    });

    it('should throw if not a valid obj', () => {
        expect(()=>{
            parseValue(`{ not a valid object literal`);
        }).to.throw('Invalid value object');
    });
});