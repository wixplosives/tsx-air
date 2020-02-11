import { evalAst } from '@tsx-air/compiler-utils';
import { analyzeFixtureComponents } from '../../test.helpers';
import { generateChangeBitMask } from './bitmask';
import { expect } from 'chai';

describe('createChangeBitMask', () => {
    it('should assign a key for every used props and store key', () => {
        const [withNothing, withProps, withState, withBoth] =
            analyzeFixtureComponents(`minimal.components.tsx`)
                .map(compDef => evalAst(generateChangeBitMask(compDef)));

        expect(withNothing, 'with no variables').to.eql({});
        expect(withProps, 'with props').to.eql({ 'props.a': 1 << 0, 'props.b': 1 << 1 });
        expect(withState, 'with stores').to.eql({ 'store1.a': 1 << 0, 'store1.b': 1 << 1 });
        expect(withBoth, 'with both').to.eql({ 
            'props.a': 1 << 0, 
            'props.b': 1 << 1, 
            'store2.a': 1 << 2, 
            'store2.b': 1 << 3 });
    });
});