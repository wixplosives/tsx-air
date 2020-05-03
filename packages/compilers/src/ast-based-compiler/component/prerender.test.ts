// tslint:disable: no-unused-expression
import { functions } from '../../test.helpers';
import { expect } from 'chai';
import { getPreRenderOf, mockRuntime } from './prerender.test.helpers';
import { createSandbox } from 'sinon';

describe('generatePreRender', () => {
    const sandbox = createSandbox();
    beforeEach(() => {
        sandbox.spy(mockRuntime.TSXAir.runtime, 'updateState');
    });
    afterEach(() => sandbox.restore());

    it('returns an object with all the component scope variables', () => {
        const preRenderOf = getPreRenderOf(functions());        
        const state = {s:{a:0}};

        expect(preRenderOf.WithStateChangeOnly(null, state), 'WithStateChangeOnly').to.eql({});
        expect(state).to.eql({s:{a:3}});
        sandbox.restore();

        expect(preRenderOf.WithNonStateChangingCode, 'WithNonStateChangingCode').to.be.undefined;
        expect(preRenderOf.WithVolatileVars({ p: 1 }, null), 'WithVolatileVars')
            .to.eql({ a: 1, b: 3 });
        
        const withFunctions = preRenderOf.WithVolatileFunction({ p: 1 }, { s: { a: 1 } });
        expect(withFunctions).to.contain({ b: 3 }, 'expected result to contain calculated volatile value');
        expect(withFunctions.someFunc).to.be.a('function');
        expect(withFunctions.unusedFunc, 'did not remove unused function').to.be.undefined;
        expect(withFunctions.unusedVar, 'did not remove unused var').to.be.undefined;
    });
});