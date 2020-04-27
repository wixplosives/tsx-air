import { expect } from 'chai';
import { getFlattened } from './helpers';
describe('ast compiler helpers', () => {
    describe('getFlattened', () => {
        it('returns a string array of the first level children', () => {
            expect(getFlattened(), `undefined map`).to.eql(new Set([]));
            expect(getFlattened({}), `empty map`).to.eql(new Set([]));
            expect(getFlattened({a:{}, b:{}}), `flat map`).to.eql(new Set(['a','b']));
            expect(getFlattened({a:{b:{}}, c:{}}), `1 level deep map`).to.eql(new Set(['a.b','c']));
            expect(getFlattened({a:{b:{c:{}}}, d:{e:{}}, f:{}}), `1 level deep map`).to.eql(new Set(['a.b','d.e', 'f']));
        });
    });
    describe(``,()=>{
        
    })
});