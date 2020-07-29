import { basicPatterns } from '../../../test.helpers';
import { CompDefinition, evalAst } from '@tsx-air/compiler-utils';
import { generateToString } from './to.string';
import { chaiPlugin } from '@tsx-air/testing';
import { expect, use } from 'chai';
import { asFunction } from '../function';
import sinon, { SinonStub } from 'sinon';
import { parseFragments, FragmentData } from './jsx.fragment';
import { identity } from 'lodash';
import * as runtime from '@tsx-air/runtime';
use(chaiPlugin);

describe('generateToString', () => {
    afterEach(runtime.reset);
    let evalContext = {};
    const toStringOf = (comp: CompDefinition, props: any, scope = {}) => {
        const frag = parseFragments(comp).next().value as FragmentData;
        const asFunc = evalAst(asFunction(generateToString(frag)), { ...evalContext }) as () => any;
        return () => asFunc.apply({ $rt: runtime.getInstance(), stores: { $props: props }, ...scope, unique: identity });
    };
    it('generates a toString method based on the used props and state', () => {
        const comps = basicPatterns();

        expect(toStringOf(comps.Static, {})(), 'Static').to.equal('<div></div>');
        expect(toStringOf(comps.PropsOnly, { 'props.a': 'a', 'props.b': 'b' })(), 'PropsOnly')
            .to.equal(`<div><!--X-->a<!--X--><!--X-->b<!--X--></div>`);
        expect(toStringOf(comps.StateOnly, {'store1.a':1, 'store1.b':2})(), 'StateOnly')
            .to.equal(`<div><!--X-->1<!--X--><!--X-->2<!--X--></div>`);
        expect(toStringOf(comps.DynamicAttributes, { 'props.a': 1 })(), 'DynamicAttributes')
            .to.equal(`<div dir="ltr" lang="1" x-da="!"><span></span></div>`);
        expect(toStringOf(comps.DynamicAttributesSelfClosing, { 'props.a': 2 })(), 'DynamicAttributesSelfClosing')
            .to.equal(`<div dir="ltr" lang="2" x-da="!"></div>`);
        expect(toStringOf(comps.WithVolatile, {d:'volatile'})(), 'WithVolatile')
            .to.equal(`<div><!--X-->volatile<!--X--></div>`);
    });

    it(`removes event listeners`, () => {
        const { EventListener } = basicPatterns();
        const withEvent = toStringOf(EventListener, {});

        expect(withEvent()).to.eql(`<div x-da="!"></div>`);
    });
});