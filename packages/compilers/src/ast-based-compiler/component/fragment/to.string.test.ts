import { basicPatterns, functions } from '../../../test.helpers';
import { CompDefinition, evalAst } from '@tsx-air/compiler-utils';
import { generateToString } from './to.string';
import { chaiPlugin } from '@tsx-air/testing';
import { expect, use } from 'chai';
import { TSXAir, store, Component } from '@tsx-air/framework';
import { asFunction } from '../function';
import sinon, { SinonStub } from 'sinon';
import { parseFragments, FragmentData } from './jsx.fragment';
import { identity } from 'lodash';
use(chaiPlugin);

describe('generateToString', () => {
    let evalContext = {};
    const toStringOf = (comp: CompDefinition, props: any, state: any = {}, volatile: any = {}, scope = {}) => {
        const frag = parseFragments(comp).next().value as FragmentData;
        const asFunc = evalAst(asFunction(generateToString(frag)), { TSXAir, store, ...evalContext }) as ()=>any;
        return () => asFunc.apply({ props, state, volatile, ...scope, unique:identity });
    };
    it('generates a toString method based on the used props and state', () => {
        const comps = basicPatterns();

        expect(toStringOf(comps.Static, {})(), 'Static').to.equal('<div></div>');
        expect(toStringOf(comps.PropsOnly, { a: 'a', b: 'b', unused: '!' })(), 'PropsOnly')
            .to.equal(`<div><!--X-->a<!--X--><!--X-->b<!--X--></div>`);
        expect(toStringOf(comps.StateOnly, {}, { store1: { a: 1, b: 2 } })(), 'StateOnly')
            .to.equal(`<div><!--X-->1<!--X--><!--X-->2<!--X--></div>`);
        expect(toStringOf(comps.ProsAndState, { a: 'a', b: 'b' }, { store2: { a: 1, b: 2 } })(), 'ProsAndState')
            .to.equal(`<div><!--X-->a<!--X--><!--X-->b<!--X--><!--X-->1<!--X--><!--X-->2<!--X--></div>`);
        expect(toStringOf(comps.DynamicAttributes, { a: 1 })(), 'DynamicAttributes')
            .to.equal(`<div dir="ltr" lang="1" x-da="!"><span></span></div>`);
        expect(toStringOf(comps.DynamicAttributesSelfClosing, { a: 2 })(), 'DynamicAttributesSelfClosing')
            .to.equal(`<div dir="ltr" lang="2" x-da="!"></div>`);
        expect(toStringOf(comps.WithVolatile, { p: 2 }, {}, { d: 'volatile' })(), 'WithVolatile')
            .to.equal(`<div><!--X-->volatile<!--X--></div>`);
    });

    describe(`nested components`, () => {
        let stub: SinonStub;
        beforeEach(() => {
            stub = sinon.stub(TSXAir.runtime, 'toString');
        });
        it(`uses TSXAir.runtime.toString to evaluate nested components`, () => {
            const { NestedStateless } = basicPatterns();
            evalContext = { PropsOnly: class PropsOnly extends Component { } };
            const mockVElm = {};
            const nested = toStringOf(NestedStateless, {
                a: 'outer'
            }, {}, {}, {
                $PropsOnly0: mockVElm
            });

            stub.callsFake((x: any) => {
                expect(x).to.eql(mockVElm);
                return `MockVirtualComponent`;
            });
            expect(nested()).to.be.eql(`<div><!--C-->MockVirtualComponent<!--C--></div>`);
        });
        afterEach(() => {
            stub.restore();
        });
    });

    it(`removes event listeners`, () => {
        const { EventListener } = basicPatterns();
        const withEvent = toStringOf(EventListener, {});

        expect(withEvent()).to.eql(`<div x-da="!"></div>`);
    });

    it(`handles function calls by referring to owner`, () => {
        const { WithVolatileFunction } = functions();
        const withFunctionCalls = toStringOf(WithVolatileFunction, {}, {}, {}, {
            owner: {
                someFunc: (x: string) => {
                    expect(x).to.eql('const');
                    return 'func';
                }
            }
        });

        expect(withFunctionCalls()).to.eql(`<div><!--X-->func<!--X--></div>`);
    });
});