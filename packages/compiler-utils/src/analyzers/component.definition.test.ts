import { expect } from 'chai';
import { getCompDef } from './test.helpers';
// tslint:disable: no-unused-expression

describe('TSXAir component definition', () => {
    describe('invalid calls', () => {
        it('should return error for invalid TSXAir calls', () => {
            const expected = {
                kind: 'error',
                errors: [{
                    message: 'TSXAir must be called with a single (function) argument',
                    type: 'code'
                }]
            };
            expect(getCompDef(`const A=TSXAir()`).comp).to.deep.include(expected);
            expect(getCompDef(`const A=TSXAir(()=>(<div/>), 'Extra argument')`).comp).to.deep.include(expected);
            expect(getCompDef(`const A=TSXAir('not a function')`).comp).to.deep.include(expected);
        });
        it('should return error for invalid names', () => {
            const expected = {
                kind: 'error',
                errors: [{
                    message: `Components name must start with a capital letter`,
                    type: 'code'
                }]
            };
            expect(getCompDef(`const Valid=TSXAir(()=>(<div/>))`).comp.errors).to.be.undefined;
            expect(getCompDef(`const a=TSXAir(()=>(<div/>))`).comp).to.deep.include(expected);
            expect(getCompDef(`TSXAir(()=>(<div/>))`).comp).to.deep.include(expected);
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
    describe(`returns`, () => {
        it(`contains all the return paths`, () => {
            const { comp } = getCompDef(`const Comp = TSXAir(p => {
                if (p.a === 0) {
                    return <div>ret 0</div>
                } else {
                    return <div>ret 1</div>
                }
                do {
                    return <div>ret 2</div>
                } while (true);
                while (true) {
                    return <div>ret 3</div>
                }
                switch(p.a){
                    case 4: return <div>ret 4</div>;
                    case 5: return <div>ret 5</div>;
                    break;
                    default: return <div>ret 6</div>
                }
                { return <div>ret 7</div> }
                for (const a of p.a) {
                    if (a === 0) return <div>ret 8</div>
                } 
                return <div>ret 9</div>;
            })`);

            expect(comp.returns).to.have.length(10);
            comp.returns.forEach((r,i) => expect(r.value).to.equal(`<div>ret ${i}</div>`));
        });
    });
});