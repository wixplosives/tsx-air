import { evalAst } from '@tsx-air/compiler-utils';
import { basicPatterns } from '../../test.helpers';
import { generateChangeBitMask } from './bitmask';
import { expect } from 'chai';
import { mapValues } from 'lodash';

describe('createChangeBitMask', () => {

    it('should assign a key for every used props and store key', () => {
        const comp = mapValues(basicPatterns(), compDef => evalAst(generateChangeBitMask(compDef)));

        expect(comp.Static, 'Static').to.eql({});
        expect(comp.PropsOnly, 'with props').to.eql({ 'props.a': 1 << 0, 'props.b': 1 << 1 });
        expect(comp.StateOnly, 'with stores').to.eql({ 'store1.a': 1 << 0, 'store1.b': 1 << 1 });
        expect(comp.ProsAndState, 'with both').to.eql({
            'props.a': 1 << 0,
            'props.b': 1 << 1,
            'store2.a': 1 << 2,
            'store2.b': 1 << 3
        });
        expect(comp.DynamicAttributes, 'DynamicAttributes').to.eql({ 'props.a': 1 << 0 });
        expect(comp.DynamicAttributesSelfClosing, 'DynamicAttributesSelfClosing').to.eql({'props.a': 1 << 0});
    });
});