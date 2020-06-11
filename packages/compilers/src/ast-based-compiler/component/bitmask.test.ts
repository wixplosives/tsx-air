import { basicPatterns } from '../../test.helpers';
import { createChangeBitMask } from './bitmask';
import { expect } from 'chai';
import { CompDefinition } from '@tsx-air/compiler-utils/src';

describe('createChangeBitMask', () => {
    const bitsOf = (comp:CompDefinition) => JSON.parse(createChangeBitMask(comp));

    it('should assign a key for every used props and store key', () => {
        const {StateOnly, PropsOnly, Static, ProsAndState,
            DynamicAttributes,DynamicAttributesSelfClosing
        } = basicPatterns();

        expect(bitsOf(Static), 'Static').to.eql({});
        expect(bitsOf(PropsOnly), 'with props').to.eql({ 'props.a': 1 << 0, 'props.b': 1 << 1 });
        expect(bitsOf(StateOnly), 'with stores').to.eql({ 'store1.a': 1 << 0, 'store1.b': 1 << 1 });
        expect(bitsOf(ProsAndState), 'with both').to.eql({
            'props.a': 1 << 0,
            'props.b': 1 << 1,
            'store2.a': 1 << 2,
            'store2.b': 1 << 3
        });
        expect(bitsOf(DynamicAttributes), 'DynamicAttributes').to.eql({ 'props.a': 1 << 0 });
        expect(bitsOf(DynamicAttributesSelfClosing), 'DynamicAttributesSelfClosing').to.eql({'props.a': 1 << 0});
    });
});