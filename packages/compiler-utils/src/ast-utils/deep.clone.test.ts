import { cloneDeep } from './clone.deep';
import { parseValue } from '..';
import { expect } from 'chai';
import ts from 'typescript';

describe('cloneDeep', () => {
    it('should return a clone of the tree ready to be reused and attached', () => {
        const ast = parseValue(`window.location`) as ts.PropertyAccessExpression;
        const clone = cloneDeep(ast);

        expect(clone).to.have.astLike(`window.location`);
        expect(clone).to.not.equal(ast);
        expect(clone.expression).to.not.equal(ast.expression);
    });
});