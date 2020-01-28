import { parseValue } from '../../astUtils/parser';
import { expect } from 'chai';
import { cloneDeep, cClass, cObject, cAssign, cImport } from './ast-generators';
import ts from 'typescript';
import { printAst } from '../../dev-utils/print-ast';
import { expectEqualIgnoreWhiteSpace } from '../../dev-utils/expect-equal-ingnore-whitespace';


describe('cloneDeep', () => {
    it('should return a clone of the tree ready to be reused and attached', () => {

        const ast = parseValue(`window.location`) as ts.PropertyAccessExpression;
        const clone = cloneDeep(ast);

        expect(clone).to.not.equal(ast);
        expect(clone.expression).to.not.equal(ast.expression);
    });
});


describe('cImport', () => {
    it('should create the ast of an import statement', () => {

        const imp = cImport({
            modulePath: './file',
            exports: [
                {
                    importedName: 'Comp'
                }
            ]
        });
        expectEqualIgnoreWhiteSpace(printAst(imp), `import { Comp } from './file'`);
    });

    it('should allow importing with a different local name', () => {

        const imp = cImport({
            modulePath: './file',
            exports: [
                {
                    importedName: 'Comp',
                    localName: 'Bomp'
                }
            ]
        });
        expectEqualIgnoreWhiteSpace(printAst(imp), `import { Comp as Bomp } from './file'`);
    });

    it('should allow importing default exports', () => {

        const imp = cImport({
            modulePath: './file',
            exports: [
            ],
            defaultLocalName: 'Zagzag'
        });
        expectEqualIgnoreWhiteSpace(printAst(imp), `import Zagzag from './file'`);
    });

    it('should support combinations', () => {
        const imp = cImport({
            modulePath: './file',
            exports: [{
                importedName: 'a'
            }, {
                importedName: 'b',
                localName: 'c'
            }
            ],
            defaultLocalName: 'Zagzag'
        });
        expectEqualIgnoreWhiteSpace(printAst(imp), `import Zagzag, { a, b as c } from './file'`);
    });
});


describe('cClass', () => {
    it('should create the ast of a class', () => {
        const cls = cClass('MyComp', undefined, undefined, []);
        expectEqualIgnoreWhiteSpace(printAst(cls), `export class MyComp { }`);
    });
    it('should support defining inheritance', () => {
        const cls = cClass('MyComp', 'ParentComp', undefined, []);
        expectEqualIgnoreWhiteSpace(printAst(cls), `export class MyComp extends ParentComp { }`);
    });
    describe('class constructor', () => {
        it('should support class constructor', () => {
            const cls = cClass('MyComp', undefined, {
                params: ['props'],
                statements: [
                    cAssign(['this', 'props'], ['props'])
                ]
            }, []);
            expectEqualIgnoreWhiteSpace(printAst(cls), `export class MyComp {
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
            expectEqualIgnoreWhiteSpace(printAst(cls), `export class MyComp {
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
            expectEqualIgnoreWhiteSpace(printAst(cls), `export class MyComp {
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
            expectEqualIgnoreWhiteSpace(printAst(cls), `export class MyComp {
                public static propA = {
                    a: 3,
                    b: 79
                };
             }`);
        });
    });

});
