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

    describe('extractPreRender', () => {
        it('remove store creation, functions and return statement from a component function', () => {
            const comp = functions().WithStateChangeOnly;
            const asClass = cClass('', undefined, undefined, [
                extractPreRender(comp)
            ]);
            expect(asClass).
                to.have.astLike(`export class {
                $preRender(__0, {s}) {
                    TSXAir.runtime.updateState(this, ({s}) => {
                        s.a=3;
                        return WithStateChangeOnly.changeBitmask['s.a'] | TSXAir.runtime.flags['preRender'];
                    });
                    return {};
                }
            }`);
        });

        it('return the closure variables', () => {
            const comp = functions().WithVolatileVars;
            const asClass = cClass('', undefined, undefined, [
                extractPreRender(comp)
            ]);
            expect(asClass).
                to.have.astLike(`export class {
                $preRender(props) {
                    var a = props.p;
                    var b = a + 1;
                    b++;
                    return {a,b};
                }
            }`);
        });

        it('return the closure variables', () => {
            const comp = functions().WithVolatileAndStateChange;
            const asClass = cClass('', undefined, undefined, [
                extractPreRender(comp)
            ]);
            expect(asClass).
                to.have.astLike(`export class {
                $preRender(props, {s}) {
                    var b = s.a + 1;
                    b++;
                        TSXAir.runtime.updateState(this, ({s}) => {
                        s.a=s.a + b;
                        return WithVolatileAndStateChange.changeBitmask['s.a'] | TSXAir.runtime.flags['preRender'];
                    });
                    return {b};
                }
            }`);
        });
    });
});