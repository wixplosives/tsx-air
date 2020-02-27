import { functions } from '../../test.helpers';
import { expect, use } from 'chai';
import { generateStateAwareFunction, extractPreRender } from './function';
import { chaiPlugin } from '@tsx-air/testing';
import {  cClass } from '@tsx-air/compiler-utils';
// import '../../../fixtures/functions';

use(chaiPlugin);

describe('functions', () => {
    describe('generateStateAwareFunction', () => {
        it('replaces state modifications with framework calls', () => {
            const comp = functions().WithStateChangeOnly;
            expect(generateStateAwareFunction(comp, comp.functions[0])).
                to.have.astLike(`() => {                 
                     TSXAir.runtime.updateState(this, ({s}) => {
                        s.a = 1;
                        return WithStateChangeOnly.changeBitmask['s.a'];
                    });
                    TSXAir.runtime.updateState(this, ({s}) => {
                        s.a = s.a + 1;
                        return WithStateChangeOnly.changeBitmask['s.a'];
                    });
                    TSXAir.runtime.updateState(this, ({s}) => {
                        s.a++;
                        return WithStateChangeOnly.changeBitmask['s.a'];
                    });
                }
            `);
        });
        it(`leaves code that doesn't change the state as is`, () => {
            const comp = functions().WithNonStateChangingCode;
            expect(generateStateAwareFunction(comp, comp.functions[0])).
                to.have.astLike(`() => {                 
                    var a = 1;
                    if (a===2) {
                        console.log(s.a);
                    }
                    TSXAir.runtime.updateState(this, ({s}) => {
                        s.a++;
                        return WithNonStateChangingCode.changeBitmask['s.a'];
                    });
                }
            `);
        });

    });
});