import { expect } from 'chai';
import {  cClass, cObject, cAssign, cProperty, cImport, cStatic } from '.';
import ts from 'typescript';



describe('cImport', () => {
    it('should create the ast of an import statement', () => {
        expect(cImport({
            modulePath: './file',
            exports: [
                {
                    importedName: 'Comp'
                }
            ]
        })).to.have.astLike(`import { Comp } from './file'`);
    });

    it('should allow importing with a different local name', () => {
        expect(cImport({
            modulePath: './file',
            exports: [
                {
                    importedName: 'Comp',
                    localName: 'Bomp'
                }
            ]
        })).to.have.astLike(`import { Comp as Bomp } from './file'`);
    });

    it('should allow importing default exports', () => {
        expect(cImport({
            modulePath: './file',
            exports: [
            ],
            defaultLocalName: 'Zagzag'
        })).to.have.astLike(`import Zagzag from './file'`);
    });

    it('should support combinations', () => {
        expect(cImport({
            modulePath: './file',
            exports: [{
                importedName: 'a'
            }, {
                importedName: 'b',
                localName: 'c'
            }
            ],
            defaultLocalName: 'Zagzag'
        })).to.have.astLike(`import Zagzag, { a, b as c } from './file'`);
    });
});


describe('cClass', () => {
    it('should create the ast of a class', () => {
        expect(cClass('MyComp')).to.have.astLike(`export class MyComp { }`);
    });
    it('should support defining inheritance', () => {
        expect(cClass('MyComp', 'ParentComp')).to.have.astLike(`export class MyComp extends ParentComp { }`);
    });
    describe('class constructor', () => {
        it('should support class constructor', () => {
            expect(cClass('MyComp', undefined, {
                params: ['props'],
                statements: [
                    cAssign(['this', 'props'], ['props'])
                ]
            })).to.have.astLike(`export class MyComp {
                constructor(props) {
                    this.props = props;
                }
             }`);
        });
    });
    describe('class properties', () => {
        it('should support properties', () => {
            expect(cClass('MyComp', undefined, undefined, [
                cProperty('propA', ts.createTrue())
            ])).to.have.astLike(`export class MyComp {
                propA = true;
             }`);
        });
        it('should support static properties', () => {
            expect(cClass('MyComp', undefined, undefined, [
                cStatic('propA', ts.createTrue())
            ])).to.have.astLike(`export class MyComp {
                static propA = true;
             }`);
        });
        it('should support complex properties', () => {
            expect(cClass('MyComp', undefined, undefined, [
                cStatic('propA', cObject({
                    a: 3,
                    b: 79
                }))
            ])).to.have.astLike(`export class MyComp {
                static propA = {
                    a: 3,
                    b: 79
                };
             }`);
        });
    });
});
