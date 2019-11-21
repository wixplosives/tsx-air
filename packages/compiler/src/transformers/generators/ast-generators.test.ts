import { parseValue } from '../../astUtils/parser';
import { expect } from 'chai';
import { cloneDeep, cClass, cObject, cAssign } from './ast-generators';
import ts from 'typescript';
import { printAST } from '../../dev-utils/print-ast';
import { expectEqualIgnoreWhiteSpace } from '../../dev-utils/expect-equal-ingnore-whitespace';


describe('cloneDeep', () => {
    it('should return a clone of the tree ready to be reused and attached', () => {

        const ast = parseValue(`window.location`) as ts.PropertyAccessExpression;
        const clone = cloneDeep(ast);

        expect(clone).to.not.equal(ast);
        expect(clone.expression).to.not.equal(ast.expression);
    });
});


describe('cClass', () => {
    it('should create the ast of a class', () => {
        const cls = cClass('MyComp', undefined, undefined, []);
        expectEqualIgnoreWhiteSpace(printAST(cls), `export class MyComp { }`);
    });
    it('should support defining inheritance', () => {
        const cls = cClass('MyComp', 'ParentComp', undefined, []);
        expectEqualIgnoreWhiteSpace(printAST(cls), `export class MyComp extends ParentComp { }`);
    });
    describe('class constructor', () => {
        it('should support class constructor', () => {
            const cls = cClass('MyComp', undefined, {
                params: ['props'],
                statements: [
                    cAssign(['this', 'props'], ['props'])
                ]
            }, []);
            expectEqualIgnoreWhiteSpace(printAST(cls), `export class MyComp {
                constructor(props) {
                    this.props = props;
                }
             }`);
        });
    });
    describe('class properties', () => {
        it('should support properties', () => {
            const cls = cClass('MyComp', undefined, undefined, [{
                name: 'propA',
                isPublic: false,
                isStatic: false,
                initializer: ts.createTrue()
            }]);
            expectEqualIgnoreWhiteSpace(printAST(cls), `export class MyComp {
                private propA = true;
             }`);
        });
        it('should support static properties', () => {
            const cls = cClass('MyComp', undefined, undefined, [{
                name: 'propA',
                isPublic: true,
                isStatic: true,
                initializer: ts.createTrue()
            }]);
            expectEqualIgnoreWhiteSpace(printAST(cls), `export class MyComp {
                public static propA = true;
             }`);
        });
        it('should support complex properties', () => {
            const cls = cClass('MyComp', undefined, undefined, [{
                name: 'propA',
                isPublic: true,
                isStatic: true,
                initializer: cObject({
                    a: 3,
                    b: 79
                })
            }]);
            expectEqualIgnoreWhiteSpace(printAST(cls), `export class MyComp {
                public static propA = {
                    a: 3,
                    b: 79
                };
             }`);
        });
    });

});
