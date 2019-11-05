import {  parseStatement } from '../astUtils/parser';
import { expect } from 'chai';
import { compDefinition } from './comp-definition';
import ts, { isCallExpression } from 'typescript';
import { find } from '../astUtils/scanner';
import { CompDefinition } from './types';

const getCompDef = (code: string) => {
    const ast = parseStatement(code);
    const tsxairNode = find(ast, node => isCallExpression(node));
    const comp = compDefinition(tsxairNode as ts.CallExpression);

    return { ast, comp, tsxairNode };
};

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
            const { comp, tsxairNode } = getCompDef(`TSXAir(() => (<div />))`);
            expect(comp).to.deep.include({
                kind: 'CompDefinition',
                propsIdentifier: undefined,
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

            const { usedProps } = comp as CompDefinition;
            expect(usedProps).to.have.length(1);
            expect(usedProps[0]).to.deep.include({ kind: 'CompProps', name: 'name' });
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

            const { usedProps } = comp as CompDefinition;
            expect(usedProps).to.have.length(1);
            expect(usedProps[0]).to.deep.include({ kind: 'CompProps', name: 'name' });
        });
    });

    describe('jsx', () => {
        it('should find all the jsx roots', () => {
            const { comp: c } = getCompDef(`const Comp = TSXAir(function(props){ 
                const aRandomJsx = <span>!</span>;
                return <div>{props.name}</div>;})`);
            const comp = c as CompDefinition;

            expect(comp.jsxRoots).to.have.length(2);
            const [span, div] = comp.jsxRoots.map(i => i.sourceAstNode.getText());
            expect(span).to.equal('<span>!</span>');
            expect(div).to.equal('<div>{props.name}</div>');
        });

        it('should find {jsxExpressions}', () => {
            const { comp: c } = getCompDef(`const Comp = TSXAir(function(props){ 
                const aRandomJsx = <span>!</span>;
                return <div>{props.name}{3}</div>;})`);
            const comp = c as CompDefinition;

            expect(comp.jsxRoots).to.have.length(2);
            const [span, div] = comp.jsxRoots.map(i => i.expressions);
            expect(span).to.have.length(0);
            expect(div).to.have.length(2);
            expect(div[0].dependencies).to.have.length(1);
            expect(div[0].dependencies[0].name).to.equal('name');
            expect(div[1].dependencies).to.deep.equal([]);
        });

        // it('should find components', () => {
        //     const { comp: c } = getCompDef(`const Comp = TSXAir(function(props){ 
        //         return <div>
        //             <Comp1 />
        //             <Comp2>bla</Comp2>
        //         </div>;})`);
        //     const comp = c as CompDefinition;

        //     expect(comp.jsxRoots[0].components).to.have.length(1);
        //     const [comp1, comp2] = comp.jsxRoots.map(i => i.components);

        // });
    });
});