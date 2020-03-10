// tslint:disable: no-unused-expression
import { functions } from '../../test.helpers';
import { expect } from 'chai';
import { getPreRenderOf } from './prerender.test.helpers';

describe('generatePreRender', () => {
    it('returns an object with all the component scope variables', () => {
        const preRenderOf = getPreRenderOf(functions());
        expect(preRenderOf.WithStateChangeOnly(null, { s: { a: 1 } }).onClick, 'WithStateChangeOnly').to.be.a('function');
        expect(preRenderOf.WithNonStateChangingCode(null, { s: { a: 1 } }), 'WithNonStateChangingCode').to.have.keys(['onClick']);
        expect(preRenderOf.WithVolatileVars({ p: 1 }, null), 'WithVolatileVars')
            .to.eql({ a: 1, b: 3 });
        
        const withFunctions = preRenderOf.WithVolatileFunction({ p: 1 }, { s: { a: 1 } });
        expect(withFunctions).to.contain({ b: 3 }, 'expected result to contain calculated volatile value');
        expect(withFunctions.someFunc).to.be.a('function');
        expect(withFunctions.unusedFunc, 'did not remove unused function').to.be.undefined;
        expect(withFunctions.unusedVar, 'did not remove unused var').to.be.undefined;
    });
});