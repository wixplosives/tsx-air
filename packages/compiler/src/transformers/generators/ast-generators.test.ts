import { parseValue } from '../../astUtils/parser';
import { expect } from 'chai';
import { cloneDeep } from './ast-generators';
import { printAST } from '../../dev-utils/print-ast';


describe('cloneDeep', () => {
    it('should return a clone of the tree ready to be reused and attached', () => {

        const ast = parseValue(`window.location`);
        expect(() => printAST(ast)).to.throw();
        expect(printAST(cloneDeep(ast))).to.include('const a = window.location');
    });
});
