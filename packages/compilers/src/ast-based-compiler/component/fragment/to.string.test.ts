import { readFixture } from '../../../test.helpers';
import { chaiPlugin } from '@tsx-air/testing';
import { expect, use } from 'chai';
import { compileAndEval } from '@tsx-air/builder';
import { astBasedCompiler } from '@tsx-air/compilers';
import { Component, Runtime } from '@tsx-air/runtime';
import { JSDOM } from 'jsdom';
use(chaiPlugin);

describe('generateToString', () => {
    let comps: {
        Static: typeof Component;
        PropsOnly: typeof Component;
        StateOnly: typeof Component;
        ProsAndState: typeof Component;
        NestedStateless: typeof Component;
        EventListener: typeof Component;
        DynamicAttributes: typeof Component;
        DynamicAttributesSelfClosing: typeof Component;
        WithVolatile: typeof Component;
        StaticAttributes: typeof Component;
    };
    before(() => {
        comps = compileAndEval(readFixture(`basic.patterns.tsx`), astBasedCompiler) as any;
    });
    const toStringOf = (comp: typeof Component, props: any) => {
        const { window } = new JSDOM(`<!DOCTYPE html><html><body></body></html>`);
        const instance = new comp('', undefined, props, new Runtime(window, () => void (0)));
        return instance.toString();
    };
    it('generates a toString method based on the used props and state', () => {
        expect(toStringOf(comps.Static, {}), 'Static').to.equal('<div></div>');
        expect(toStringOf(comps.PropsOnly, { 'a': 'a', 'b': 'b' }), 'PropsOnly')
            .to.equal(`<div><!--0X0-->a<!--0X0--><!--0X1-->b<!--0X1--></div>`);
        expect(toStringOf(comps.DynamicAttributes, { 'a': 1 }), 'DynamicAttributes')
            .to.equal(`<div dir="ltr" lang="1" x-da="0"><span></span></div>`);
        expect(toStringOf(comps.DynamicAttributesSelfClosing, { 'a': 2 }), 'DynamicAttributesSelfClosing')
            .to.equal(`<div dir="ltr" lang="2" x-da="0"></div>`);
    });

    it(`removes event listeners`, () => {
        expect(toStringOf(comps.EventListener, {})).to.eql(`<div x-da="0"></div>`);
    });
    
    it.only(`keep href`, () => {
        expect(toStringOf(comps.StaticAttributes, {})).to.eql(`<div class="cls" dir="ltr"><a href="#"></a></div>`);
    });
});