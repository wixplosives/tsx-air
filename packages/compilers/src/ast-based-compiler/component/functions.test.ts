import { functions } from '../../test.helpers';
import { expect, use } from 'chai';
import { chaiPlugin } from '@tsx-air/testing';
import { mockRuntime, evalStateSafeFunc } from './functions.test.helper';
import { createSandbox, SinonSpy } from 'sinon';

use(chaiPlugin);

describe('functions', () => {
    const sandbox = createSandbox();
    beforeEach(() => {
        sandbox.spy(mockRuntime.TSXAir.runtime, 'updateState');
        sandbox.spy(mockRuntime.console, 'log');
    });
    afterEach(() => sandbox.restore());

    describe('generateStateAwareFunction', () => {
        it('replaces state modifications with framework calls', () => {
            const state = { state: { s: 1 } };
            const func = evalStateSafeFunc(functions().WithStateChangeOnly, null, state, {});
            func();

            expect((mockRuntime.TSXAir.runtime.updateState as SinonSpy).callCount).to.equal(3);
            const calls = (mockRuntime.TSXAir.runtime.updateState as SinonSpy).getCalls();


            const s0: any = { s: {} };
            expect(calls[0].args[1](s0)).to.eql(mockRuntime.WithStateChangeOnly.changeBitmask['s.a']);
            expect(s0.s.a, `the first mutator should mutator should set s.a=1`).to.equal(1);

            const s1: any = { s: { a: 0 } };
            expect(calls[1].args[1](s1)).to.equal(mockRuntime.WithStateChangeOnly.changeBitmask['s.b']);
            expect(s1.s.a).to.equal(0, `the second mutator should not change s.a`);
            expect(s1.s.b).to.equal(1, `the second mutator should set s.b=1`);

            const s2: any = { s: { a: 3 } };
            expect(calls[2].args[1](s2)).to.equal(mockRuntime.WithStateChangeOnly.changeBitmask['s.a']);
            expect(s2.s.a).to.equal(4, `the thirst mutator should 's.a++'`);
        });

        it(`runs code that doesn't change the state as is`, () => {
            const func = evalStateSafeFunc(functions().WithNonStateChangingCode, null, { s: { a: 1 } }, {});
            func();

            const log = mockRuntime.console.log as SinonSpy;
            expect(log.callCount).to.equal(1);
            expect(log.getCall(0).args).to.eql([1]);
        });

        it(`uses the state and volatile params`, () => {
            const func = evalStateSafeFunc(functions().WithVolatileFunction, { p: 1 }, { s: { a: 10 } }, { b: 100 });
            expect(func(1000)).to.equal(1111);
        });

        // TODO remove
        // it(`adds dependencies to functions postAnalysisData`, () => {
        //     const { WithNonStateChangingCode, WithStateChangeOnly, WithVolatileFunction, WithVolatileVars } = functions();
        //     [WithNonStateChangingCode, WithStateChangeOnly, WithVolatileFunction].forEach(evalStateSafeFunc);

        //     expect(postAnalysisData.read(WithNonStateChangingCode.functions[0], 'dependencies')).to.eql(['s.a']);
        //     expect(postAnalysisData.read(WithStateChangeOnly.functions[0], 'dependencies')).to.eql(['s.a']);
        //     expect(postAnalysisData.read(WithVolatileFunction.functions[0], 'dependencies')).to.eql(['props.p', 's.a']);
        // });
    });
});