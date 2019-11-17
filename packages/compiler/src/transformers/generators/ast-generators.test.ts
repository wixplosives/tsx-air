import { parseValue } from '../../astUtils/parser';
import { expect } from 'chai';
import { cloneDeep } from './ast-generators';
import ts from 'typescript';


describe('cloneDeep', () => {
    it('should return a clone of the tree ready to be reused and attached', () => {

        const ast = parseValue(`window.location`) as ts.PropertyAccessExpression;
        const clone = cloneDeep(ast);

        expect(clone).to.not.equal(ast);
        expect(clone.expression).to.not.equal(ast.expression);
    });
});
