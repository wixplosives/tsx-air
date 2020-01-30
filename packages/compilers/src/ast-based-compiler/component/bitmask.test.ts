import { evalAst } from '@tsx-air/compiler-utils';
import { analyzeFixtureComponents } from '../../test.helpers';
import { generateChangeBitMask } from './bitmask';
import { expect } from 'chai';

describe('createChangeBitMask', () => {
    const [withNothing, withProps, withState, withBoth] =
        analyzeFixtureComponents(`minimal.components.tsx`)
            .map(compDef => evalAst(generateChangeBitMask(compDef)));
            
    it('should assign a key for every used props and store key', () => {
        expect(withNothing).to.eql({});
        expect(withProps).to.eql({ a: 1 << 0, b: 1 << 1 });
        expect(withState).to.eql({ store1_a: 1 << 0, store1_b: 1 << 1 });
        expect(withBoth).to.eql({ a: 1 << 0, b: 1 << 1, store2_a: 1 << 2, store2_b: 1 << 3 });
    });
});