import { functions } from '../../test.helpers';
import { expect, use } from 'chai';
import { generateStateAwareMethod } from './function';
import { chaiPlugin } from '@tsx-air/testing';
import { asClass } from '../ast.test.helpers';
// import '../../../fixtures/functions';

use(chaiPlugin);

describe('functions', () => {
    describe('generateStateAwareFunction', () => {
        it('replaces state modifications with framework calls', () => {
            const comp = functions().WithStateChangeOnly;
            expect(asClass(generateStateAwareMethod(comp, comp.functions[0]))).
                to.have.astLike(`export class {
                _onClick(__0, {s}) {                 
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
            }`);
        });
        it(`leaves code that doesn't change the state as is`, () => {
            const comp = functions().WithNonStateChangingCode;
            expect(asClass(generateStateAwareMethod(comp, comp.functions[0]))).
                to.have.astLike(`export class {
                _onClick(__0, {s}) {                 
                    var a = 1;
                    if (a===2) {
                        console.log(s.a);
                    }
                }
            }`);
        });
        
        it(`destructures the state and volatile params`, () => {
            const comp = functions().WithVolatileAndStateChange;
            expect(asClass(generateStateAwareMethod(comp, comp.functions[0]))).
                to.have.astLike(`export class {
                _someFunc(__0, {s}, {b}, c){
                    return s.a + b + c;
                }
            }`);
        });
    });
});