import { functions } from '../../test.helpers';
import { generatePreRender } from './prerender';
import { expect } from 'chai';
import { cClass } from '@tsx-air/compiler-utils';

describe('generatePreRender', () => {
    describe('as method', () => {
        it('remove store creation, functions and return statement from a component function', () => {
            const comp = functions().WithStateChangeOnly;
            const asClass = cClass('', undefined, undefined, [
                generatePreRender(comp, false)
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
                generatePreRender(comp, false)
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
                generatePreRender(comp, false)
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
    describe('as static', () => {
        it('remove store creation, functions and return statement from a component function', () => {
            const comp = functions().WithStateChangeOnly;
            const asClass = cClass('', undefined, undefined, [
                generatePreRender(comp, true)
            ]);
            expect(asClass).
                to.have.astLike(`export class {
                static $preRender(__0, {s}) {
                    s.a=3;
                    return {};
                }
            }`);
        });

        it('return the closure variables', () => {
            const comp = functions().WithVolatileVars;
            const asClass = cClass('', undefined, undefined, [
                generatePreRender(comp, true)
            ]);
            expect(asClass).
                to.have.astLike(`export class {
                static $preRender(props) {
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
                generatePreRender(comp, true)
            ]);
            expect(asClass).
                to.have.astLike(`export class {
                static $preRender(props, {s}) {
                    var b = s.a + 1;
                    b++;
                    s.a = s.a + b;
                    return {b};
                }
            }`);
        });
    });
});