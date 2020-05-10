import { expect } from 'chai';
import { getFlattened, dependantOnVars as dv } from './helpers';
import { functions, basicPatterns } from '../../test.helpers';
import { withNoRefs, CompDefinition, UsedVariables, UsedInScope } from '@tsx-air/compiler-utils';

describe('ast compiler helpers', () => {
    const dependantOnVars:(comp: CompDefinition, scope: UsedVariables, separateFunctions? :boolean)=> UsedInScope = (a,b,c)=> withNoRefs(dv(a,b,c));

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
        expect(dependantOnVars(Static, Static.aggregatedVariables)).to.eql({});
        expect(dependantOnVars(PropsOnly, PropsOnly.aggregatedVariables)).to.eql({
            props: { props: { a: {}, b: {} } }
        });
        // Partial scope
        expect(dependantOnVars(PropsOnly, PropsOnly.jsxRoots[0].expressions[0].variables)).to.eql({
            props: { props: { a: {} } }
        });
        expect(dependantOnVars(StateOnly, StateOnly.aggregatedVariables)).to.eql({
            stores: { store1: { a: {}, b: {} } }
        });
        expect(dependantOnVars(ProsAndState, ProsAndState.aggregatedVariables)).to.eql({
            props: { props: { a: {}, b: {} } },
            stores: { store2: { a: {}, b: {} } }
        });
        expect(dependantOnVars(DynamicAttributes, DynamicAttributes.aggregatedVariables)).to.eql({
            props: { props: { a: {} } }
        });
        expect(dependantOnVars(DynamicAttributesSelfClosing, DynamicAttributesSelfClosing.aggregatedVariables)).to.eql({
            props: { props: { a: {} } }
        });
        expect(dependantOnVars(WithVolatile, WithVolatile.aggregatedVariables)).to.deep.contain({
            volatile: { b: {} }
        });
    });
    it(`finds dependencies of directly used vars`, () => {
        const { WithVolatile } = basicPatterns();
        expect(dependantOnVars(WithVolatile, WithVolatile.aggregatedVariables)).to.deep.contain({
            props: { props: { a: {} } }
        });
    });
    it(`finds variable dependencies via assignment`, () => {
        const { WithVolatile } = basicPatterns();
        expect(withNoRefs(dependantOnVars(WithVolatile, WithVolatile.jsxRoots[0].aggregatedVariables)), `props.a should be included, it's assigned to be the value of b`).to.deep.contain({
            props: { props: { a: {} } },
            volatile: { b: {} }
        });
    });
    it(`finds dependencies of EXECUTED functions`, () => {
        const withFunc = functions().WithVolatileFunction;
        expect(dependantOnVars(withFunc, withFunc.jsxRoots[0].aggregatedVariables)).to.eql({
            volatile: { someFunc: {}, b: {} },
            stores: { s: { a: {} } },
            props: { props: { p: {} } }
        });
    });
    describe(`when ignoreFunctions=true`, () => {
        it(`exclude function calls and references`, () => {
            const { WithNonStateChangingCode, WithVolatileFunction } = functions();
            expect(
                dependantOnVars(
                    WithVolatileFunction,
                    WithVolatileFunction.jsxRoots[0].aggregatedVariables,
                    // optionally ignore functions
                    true
                )
            ).to.eql({});
            expect(
                dependantOnVars(
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
                dependantOnVars(
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
        expect(dependantOnVars(WithStateChangeOnly, WithStateChangeOnly.jsxRoots[0].aggregatedVariables)).to.eql({
            volatile: { onClick: {} },
            stores: { s: { a: {} } }
        });
        expect(
            dependantOnVars(WithStateChangeOnly, WithStateChangeOnly.jsxRoots[0].aggregatedVariables)
        ).not.to.deep.contain({
            stores: { s: { b: {} } }
        });
    });
});
});
