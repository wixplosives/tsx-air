import { expect } from 'chai';
import { cClass, cObject, cAssign, cProperty, cStatic } from '.';
import ts from 'typescript';

describe('cClass', () => {
    it('should create the ast of a class', () => {
        expect(cClass('MyComp')).to.have.astLike(`class MyComp { }`);
    });
    it('should support defining inheritance', () => {
        expect(cClass('MyComp', 'ParentComp')).to.have.astLike(`class MyComp extends ParentComp { }`);
    });
    describe('class constructor', () => {
        it('should support class constructor', () => {
            expect(cClass('MyComp', undefined, {
                params: ['props'],
                statements: [
                    cAssign(['this', 'props'], ['props'])
                ]
            })).to.have.astLike(`class MyComp {
                constructor(props) {
                    this.props = props;
                }
             }`);
        });
    });
    describe('class properties', () => {
        it('should support properties', () => {
            expect(cClass('MyComp', undefined, undefined, false, [
                cProperty('propA', ts.createTrue())
            ])).to.have.astLike(`class MyComp {
                propA = true;
             }`);
        });
        it('should support static properties', () => {
            expect(cClass('MyComp', undefined, undefined, false,  [
                cStatic('propA', ts.createTrue())
            ])).to.have.astLike(`class MyComp {
                static propA = true;
             }`);
        });
        it('should support complex properties', () => {
            expect(cClass('MyComp', undefined, undefined, false, [
                cStatic('propA', cObject({
                    a: 3,
                    b: 79
                }))
            ])).to.have.astLike(`class MyComp {
                static propA = {
                    a: 3,
                    b: 79
                };
             }`);
        });
    });
});
