import { isWrongType, isArrayOf } from './type.check';
import { expect } from 'chai';
describe('type checks', () => {
    it('isWrongType', () => {
        expect(isWrongType(undefined, 'string')).to.equal(false, 
            'undefined values are not considered wrong type');
        expect(isWrongType('ok', 'string')).to.equal(false);
        expect(isWrongType({}, 'object')).to.equal(false);
        expect(isWrongType({ok:true}, x => x.ok)).to.equal(false);

        expect(isWrongType('no checks')).to.equal(true,
            'no checks imply wrong type due to a bug'); expect(isWrongType('ok', 'object')).to.equal(true, 'typeof string is "string"');
        expect(isWrongType(null, 'boolean')).to.equal(true, 'typeof null is "object" (yeah, really)');
        expect(isWrongType({ ok: false }, x => x.ok)).to.equal(true, 'predicate returned false');
    });

    it('isArrayOf', () => {
        expect(isArrayOf([], _ => false)).to.equal(true, 'an empty array is considered as true by default');
        expect(isArrayOf([], _ => false, false)).to.equal(false, 'emptyPasses = false');
        expect(isArrayOf([1], i => isNaN(i))).to.equal(false, '1 does not match the predicate');
        expect(isArrayOf([1, 0], 'number' )).to.equal(true, '1,0 are instances Number');
        expect(isArrayOf(['one', 1], i => isNaN(i))).to.equal(false, '1 does not match the predicate');
        expect(isArrayOf(['one', 'two'], isNaN)).to.equal(true, 'all items match the predicate');
        expect(isArrayOf(['one', 'two'], 'string')).to.equal(true, 'all items match the predicate');
        expect(isArrayOf('not an array', _=>true)).to.equal(false);
    });
});