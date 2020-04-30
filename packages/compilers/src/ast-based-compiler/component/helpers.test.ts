import { expect } from 'chai';
import { getFlattened, usedInScope } from './helpers';
import { functions, basicPatterns } from '../../test.helpers';
describe('ast compiler helpers', () => {
    describe('getFlattened', () => {
        it('returns a string array of the first level children', () => {
            expect(getFlattened(), `undefined map`).to.eql(new Set([]));
            expect(getFlattened({}), `empty map`).to.eql(new Set([]));
            expect(getFlattened({ a: {}, b: {} }), `flat map`).to.eql(new Set(['a', 'b']));
            expect(getFlattened({ a: { b: {} }, c: {} }), `1 level deep map`).to.eql(new Set(['a.b', 'c']));
            expect(getFlattened({ a: { b: { c: {} } }, d: { e: {} }, f: {} }), `1 level deep map`).to.eql(
                new Set(['a.b', 'd.e', 'f'])
            );
        });
    });
    describe(`usedInScope`, () => {
        it(`finds all used props, stores and volatile directly in given scope`, () => {
            const {
                Static,
                PropsOnly,
                ProsAndState,
                StateOnly,
                DynamicAttributes,
                DynamicAttributesSelfClosing,
                WithVolatile
            } = basicPatterns();
            expect(usedInScope(Static, Static.aggregatedVariables)).to.eql({});
            expect(usedInScope(PropsOnly, PropsOnly.aggregatedVariables)).to.eql({
                props: { props: { a: {}, b: {} } }
            });
            // Partial scope
            expect(usedInScope(PropsOnly, PropsOnly.jsxRoots[0].expressions[0].variables)).to.eql({
                props: { props: { a: {} } }
            });
            expect(usedInScope(StateOnly, StateOnly.aggregatedVariables)).to.eql({
                stores: { store1: { a: {}, b: {} } }
            });
            expect(usedInScope(ProsAndState, ProsAndState.aggregatedVariables)).to.eql({
                props: { props: { a: {}, b: {} } },
                stores: { store2: { a: {}, b: {} } }
            });
            expect(usedInScope(DynamicAttributes, DynamicAttributes.aggregatedVariables)).to.eql({
                props: { props: { a: {} } }
            });
            expect(usedInScope(DynamicAttributesSelfClosing, DynamicAttributesSelfClosing.aggregatedVariables)).to.eql({
                props: { props: { a: {} } }
            });
            expect(usedInScope(WithVolatile, WithVolatile.aggregatedVariables)).to.deep.contain({
                volatile: { b: {} }
            });
        });
        it(`finds dependencies of direcly used vars`, () => {
            const { WithVolatile } = basicPatterns();
            expect(usedInScope(WithVolatile, WithVolatile.aggregatedVariables)).to.deep.contain({
                props: { props: { a: {} } }
            });
        });
        it(`finds dependencies of EXECUTED functions`, () => {
            const withFunc = functions().WithVolatileFunction;
            expect(usedInScope(withFunc, withFunc.jsxRoots[0].aggregatedVariables)).to.eql({
                volatile: { someFunc: {}, b: {} },
                stores: { s: { a: {} } },
                props: { props: { p: {} } }
            });
        });
        describe(`when ignoreFunctions=true`, () => {
            it(`exclude function calls and refrences`, () => {
                const { WithNonStateChangingCode, WithVolatileFunction } = functions();
                expect(
                    usedInScope(
                        WithVolatileFunction,
                        WithVolatileFunction.jsxRoots[0].aggregatedVariables,
                        // optionally ignore functions
                        true
                    )
                ).to.eql({});
                expect(
                    usedInScope(
                        WithNonStateChangingCode,
                        WithNonStateChangingCode.jsxRoots[0].aggregatedVariables,
                        // optionally ignore functions
                        true
                    )
                ).to.eql({});
            });
            it(`includes call arguments`, () => {
                const { ValidFunctionUse } = functions();
                expect(
                    usedInScope(
                        ValidFunctionUse,
                        ValidFunctionUse.jsxRoots[0].aggregatedVariables,
                        // optionally ignore functions
                        true
                    )
                ).to.eql({
                    volatile: { vol: {} },
                    stores: { state: { a: {} } }
                });
            });
        });
        it(`doesn't aggregate variables that are modified but not read`, () => {
            const { WithStateChangeOnly } = functions();
            expect(usedInScope(WithStateChangeOnly, WithStateChangeOnly.jsxRoots[0].aggregatedVariables)).to.eql({
                volatile: { onClick: {} },
                stores: { s: { a: {} } }
            });
            expect(
                usedInScope(WithStateChangeOnly, WithStateChangeOnly.jsxRoots[0].aggregatedVariables)
            ).not.to.deep.contain({
                stores: { s: { b: {} } }
            });
        });
    });
});
