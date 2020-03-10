import { functions } from '../../test.helpers';
import { expect, use } from 'chai';
import { generateStateAwareMethod, asFunction } from './function';
import { chaiPlugin } from '@tsx-air/testing';
import { asClass } from '../ast.test.helpers';
import { mockRuntime, evalStateSafeFunc } from './functions.test.helper';
import { fake, spyCall, createSandbox, SinonSpy } from 'sinon';
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
            const call1Args = (mockRuntime.TSXAir.runtime.updateState as SinonSpy).getCall(0).args;
            const call2Args = (mockRuntime.TSXAir.runtime.updateState as SinonSpy).getCall(1).args;
            const call3Args = (mockRuntime.TSXAir.runtime.updateState as SinonSpy).getCall(2).args;

            expect(call1Args[0]).to.eql(mockRuntime);
            expect(call1Args[1]).to.equal(state);
            const s1: any = { s: {} };
            expect(call1Args[2](s1)).to.equal(mockRuntime.WithStateChangeOnly.changeBitmask['s.a']);
            expect(s1.s.a).to.equal(1);

            expect((mockRuntime.TSXAir.runtime.updateState as SinonSpy).callCount).to.equal(3);
            expect(call2Args[0]).to.eql(mockRuntime);
            expect(call2Args[1]).to.equal(state);
            const s2: any = { s: { a: 0 } };
            expect(call2Args[2](s2)).to.equal(mockRuntime.WithStateChangeOnly.changeBitmask['s.b']);
            expect(s2.s.a).to.equal(0);
            expect(s2.s.b).to.equal(1);

            expect((mockRuntime.TSXAir.runtime.updateState as SinonSpy).callCount).to.equal(3);
            expect(call3Args[0]).to.eql(mockRuntime);
            expect(call3Args[1]).to.equal(state);
            const s3: any = { s: { a: 3 } };
            expect(call3Args[2](s3)).to.equal(mockRuntime.WithStateChangeOnly.changeBitmask['s.a']);
            expect(s3.s.a).to.equal(4);
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
    });
});