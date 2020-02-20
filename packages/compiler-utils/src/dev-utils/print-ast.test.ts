import { printAst } from '@tsx-air/compiler-utils';
import { parseValue, parseStatement } from '../ast-utils/parser';
import { expect, use } from 'chai';
import { cObject } from '../ast-utils/generators/ast-generators';
import {chaiPlugin } from '@tsx-air/testing';
use(chaiPlugin);

describe('print ast', () => {
    describe('with ast created through a file', () => {
        it('should print expressions', () => {
            const ast = parseValue(`window.location`);
            expect(printAst(ast)).to.to.equal(ast.getText());
        });

        it('should print calls', () => {
            const ast = parseValue(`console.log('gaga')`);
            expect(printAst(ast)).to.to.equal(ast.getText());
        });


        it('should print statements', () => {
            const ast = parseStatement(`const a = 'baga'`);
            expect(printAst(ast)).to.to.equal(ast.getText());
        });

        it('should include types', () => {
            const ast = parseStatement(`const a: string = 'baga'`);
            expect(printAst(ast)).to.to.equal(ast.getText());
        });
    });
    describe('with ast created through a factory', () => {
        it('should print expressions', () => {
            const ast = cObject({
                a: 'gaga',
                b: 'baga'
            }, {
                multiline: true,
                useSingleQuatres: true
            });
            expect(printAst(ast)).to.be.eqlCode(`{
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
                useSingleQuatres: false
            });
            expect(printAst(ast)).to.be.eqlCode(`{
                a: "gaga",
                b: "baga"
            }`);

        });
    });
});
