import { functions } from '../../test.helpers';
import { expect, use } from 'chai';
import { generateStateAwareFunction } from './function';
import { chaiPlugin } from '@tsx-air/testing';
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

        it('remove store creation, functions and return statement from a component function', () => {
            const comp = functions().WithStateChangeOnly;
            expect(generateStateAwareFunction(comp)).
                to.have.astLike(`(__0, {s}, changeMask) => {
                    if (!(changeMask & TSXAir.runtime.flags['preRender'])) {
                        TSXAir.runtime.updateState(this, ({s}) => {
                            s.a=3;
                            return WithStateChangeOnly.changeBitmask['s.a'] | TSXAir.runtime.flags['preRender'];
                        });
                    }
                }
            `);
        });
    });
});