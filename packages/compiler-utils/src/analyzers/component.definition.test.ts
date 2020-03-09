import { expect } from 'chai';
import { getCompDef } from './test.helpers';

describe('TSXAir component definition', () => {
    describe('invalid calls', () => {
        it('should return error for invalid TSXAir calls', () => {
            const [noArgs, tooManyArgs, argNotAFunction, anonymous] = [
                `let A=TSXAir()`,
                `let A=TSXAir(()=>(<div/>), 'Extra argument')`,
                `let A=TSXAir('not a function')`,
                `TSXAir(()=>(<div />))`
            ]
                .map(getCompDef).map(i => i.comp);

            [noArgs, tooManyArgs, argNotAFunction].forEach(invalidComp =>
                expect(invalidComp).to.deep.include({
                    kind: 'error',
                    errors: [{
                        message: 'TSXAir must be called with a single (function) argument',
                        type: 'code'
                    }]
                }));
            expect(anonymous).to.deep.include({
                kind: 'error',
                errors: [{
                    message: 'Components name must start with a capital letter',
                    type: 'code'
                }]
            });
        });
    });

    describe('trivial component', () => {
        it('should return a CompDefinition with no propsIdentifier', () => {
            const { comp, tsxairNode } = getCompDef(`const A=TSXAir(props => (<div />))`);
            expect(comp).to.deep.include({
                kind: 'CompDefinition',
                propsIdentifier: undefined,
                name: 'A',
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

        it('analyzes volatile variables', () => {
            const { comp } = getCompDef(`const Comp = TSXAir(props => {
                var a=3;
                var b = props.c + a;
                var c = {d:b};
                const d = () => void 0;
                function e(){}
                return <div />;
            })`);
            expect(comp.volatileVariables).to.eql(['a', 'b', 'c', 'd', 'e']);
        });
    });
});