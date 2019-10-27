import * as ts  from 'typescript';
import { parseLiteral } from './parser';
import { expect } from 'chai';
import { scan } from './scanner';

describe('parseLiteral', () => {
    it('should return the AST of a stringified literal object', () => {
        const ast = parseLiteral(`{
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
        const ast = parseLiteral({
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
            parseLiteral(`{ not a valid object literal`);
        }).to.throw('Invalid literal object');
    });
});