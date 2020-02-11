import { expect } from 'chai';
import { getCompDef } from './test.helpers';

describe('TSXAir component definition', () => {
    describe('invalid calls', () => {
        it('should return error for non-function args', () => {
            const [noArgs, tooManyArgs, argNotAFunction] = [`TSXAir()`, `TSXAir(()=>(<div/>), 0)`, `TSXAir('not a function')`]
                .map(getCompDef).map(i => i.comp);

            [noArgs, tooManyArgs, argNotAFunction].forEach(invalidComp =>
                expect(invalidComp).to.deep.include({
                    kind: 'error',
                    errors: [{
                        message: 'TSXAir must be called with a single (function) argument',
                        type: 'code'
                    }]
                }));
        });
    });

    describe('trivial component', () => {
        it('should return a CompDefinition with no propsIdentifier', () => {
            const { comp, tsxairNode } = getCompDef(`TSXAir(props => (<div />))`);
            expect(comp).to.deep.include({
                kind: 'CompDefinition',
                propsIdentifier: undefined,
                name: undefined,
                sourceAstNode: tsxairNode
            });
        });
    });

    describe('components with props', () => {
        it('should return a ComponentDefinition for arrow function', () => {
            const { tsxairNode, comp } = getCompDef(`const Comp = TSXAir(props => (<div>{props.name}</div>))`);

            expect(comp).to.deep.include({
                kind: 'CompDefinition',
                name: 'Comp',
                propsIdentifier: 'props',
                sourceAstNode: tsxairNode
            });
        });

        it('should return a ComponentDefinition for function expression', () => {
            const { tsxairNode, comp } = getCompDef(`const Comp = TSXAir(function(props){ 
                return <div>{props.name}</div>;})`);

            expect(comp).to.deep.include({
                kind: 'CompDefinition',
                name: 'Comp',
                propsIdentifier: 'props',
                sourceAstNode: tsxairNode
            });
        });
    });
});