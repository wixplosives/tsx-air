import { postAnalysisData } from './../../common/post.analysis.data';
import { functions } from '../../test.helpers';
import { expect, use } from 'chai';
import { chaiPlugin } from '@tsx-air/testing';
import { mockRuntime, evalStateSafeFunc } from './functions.test.helper';
import { createSandbox, SinonSpy } from 'sinon';
// import '../../../fixtures/functions';

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
            const func = evalStateSafeFunc(functions().WithStateChangeOnly);
            const state = { s: 1 };
            func(null, state, {});

            expect((mockRuntime.TSXAir.runtime.updateState as SinonSpy).callCount).to.equal(3);
            const calls = (mockRuntime.TSXAir.runtime.updateState as SinonSpy).getCalls();
            calls.forEach(call => {
                expect(call.args.length, 'wrong arguments count when calling mockRuntime.TSXAir.runtime.updateState').to.equal(3);
                expect(call.args[0]).to.eql(mockRuntime, 'wrong "this" (first argument), should be globalThis');
                expect(call.args[1]).to.equal(state, `wrong state (second argument)`);
            });


            const s0: any = { s: {} };
            expect(calls[0].args[2](s0)).to.eql(mockRuntime.WithStateChangeOnly.changeBitmask['s.a']);
            expect(s0.s.a, `the first mutator should mutator should set s.a=1`).to.equal(1);

            const s1: any = { s: { a: 0 } };
            expect(calls[1].args[2](s1)).to.equal(mockRuntime.WithStateChangeOnly.changeBitmask['s.b']);
            expect(s1.s.a).to.equal(0, `the second mutator should not change s.a`);
            expect(s1.s.b).to.equal(1, `the second mutator should set s.b=1`);

            const s2: any = { s: { a: 3 } };
            expect(calls[2].args[2](s2)).to.equal(mockRuntime.WithStateChangeOnly.changeBitmask['s.a']);
            expect(s2.s.a).to.equal(4, `the thirst mutator should 's.a++'`);
        });

        it(`runs code that doesn't change the state as is`, () => {
            const func = evalStateSafeFunc(functions().WithNonStateChangingCode);
            func(null, { s: { a: 1 } }, {});

            const log = mockRuntime.console.log as SinonSpy;
            expect(log.callCount).to.equal(1);
            expect(log.getCall(0).args).to.eql([1]);
        });

        it(`uses the state and volatile params`, () => {
            const func = evalStateSafeFunc(functions().WithVolatileFunction);
            expect(func({ p: 1 }, { s: { a: 10 } }, { b: 100 }, 1000)).to.equal(1111);

        });

        it(`adds dependencies to functions postAnalysisData`, () => {
            const { WithNonStateChangingCode, WithStateChangeOnly, WithVolatileFunction, WithVolatileVars } = functions();
            [WithNonStateChangingCode, WithStateChangeOnly, WithVolatileFunction].forEach(evalStateSafeFunc);

            expect(postAnalysisData.read(WithNonStateChangingCode.functions[0], 'dependencies')).to.eql(['s.a']);
            expect(postAnalysisData.read(WithStateChangeOnly.functions[0], 'dependencies')).to.eql(['s.a']);
            expect(postAnalysisData.read(WithVolatileFunction.functions[0], 'dependencies')).to.eql(['props.p', 's.a']);
        });
    });
});