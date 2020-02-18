import { functions } from '../../test.helpers';
import { expect, use } from 'chai';
import { generateStateAwareFunction, extractPreRender } from './function';
import { chaiPlugin } from '@tsx-air/testing';
import ts from 'typescript';
import { cArray, cArrow } from '@tsx-air/compiler-utils/src';
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

    describe('extractPreRender', () => {
        it('remove store creation, functions and return statement from a component function', () => {
            const comp = functions().WithStateChangeOnly;
            const asFunc = cArrow([], extractPreRender(comp));
            expect(asFunc).
                to.have.astLike(`() => {
                   if (externalUpdatesCount) {
                        TSXAir.runtime.updateState(this, ({s}) => {
                            s.a=3;
                            return WithStateChangeOnly.changeBitmask['s.a'] | TSXAir.runtime.flags['preRender'];
                        });
                    }
                }`);
        });

        describe('when the "removeStateChanges" param is true', ()=>{
            it('remove all store modification as well', () => {
                const comp = functions().WithStateChangeOnly;
                expect(extractPreRender(comp, true)).to.eql([]);
            });
        });
    });
});