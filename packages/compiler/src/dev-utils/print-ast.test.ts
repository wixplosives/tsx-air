
import { parseValue, parseStatement } from '../astUtils/parser';
import { expect } from 'chai';
import { printAST } from './print-ast';
import { cObject } from '../transformers/generators/ast-generators';
import { expectEqualIgnoreWhiteSpace } from './expect-equal-ingnore-whitespace';

describe('print ast', () => {
    describe('with ast created through a file', () => {
        it('should print expressions', () => {
            const ast = parseValue(`window.location`);
            expect(printAST(ast)).to.to.equal(ast.getText());
        });

        it('should print calls', () => {
            const ast = parseValue(`console.log('gaga')`);
            expect(printAST(ast)).to.to.equal(ast.getText());
        });


        it('should print statements', () => {
            const ast = parseStatement(`const a = 'baga'`);
            expect(printAST(ast)).to.to.equal(ast.getText());
        });

        it('should include types', () => {
            const ast = parseStatement(`const a: string = 'baga'`);
            expect(printAST(ast)).to.to.equal(ast.getText());
        });
    });
    describe('with ast created through a factory', () => {
        it('should print expressions', () => {
            const ast = cObject({
                a: 'gaga',
                b: 'baga'
            }, {
                multiline: true,
                useSingleQuates: true
            });
            expectEqualIgnoreWhiteSpace(printAST(ast), `{
                a: 'gaga',
                b: 'baga'
            }`);

        });
        it('should support double quates', () => {
            const ast = cObject({
                a: 'gaga',
                b: 'baga'
            }, {
                multiline: true,
                useSingleQuates: false
            });
            expectEqualIgnoreWhiteSpace(printAST(ast), `{
                a: "gaga",
                b: "baga"
            }`);

        });
    });
});
