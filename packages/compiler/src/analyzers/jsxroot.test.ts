import ts from 'typescript';
import { expect } from 'chai';
import { getCompDef } from './comp-definition.test';
import { CompDefinition } from './types';
import { find } from '../astUtils/scanner';
// tslint:disable: no-unused-expression
// tslint:disable: no-shadowed-variable

describe('TSXAir component analyzer: Jsx', () => {
    it('should find all the jsx roots', () => {
        const { comp } = getCompDef(`const Comp = TSXAir(props=>{ 
                const aRandomJsx = <span>!</span>;
                return <div>{props.name}</div>;})`);

        expect(comp.jsxRoots).to.have.length(2);
        const [span, div] = comp.jsxRoots.map(i => i.sourceAstNode.getText());
        expect(span).to.equal('<span>!</span>');
        expect(div).to.equal('<div>{props.name}</div>');
    });

    describe('Expressions', () => {
        const { comp } = getCompDef(`const Comp = TSXAir(props => { 
                const aRandomJsx = <span>!</span>;
                return <div>{props.name}{3}</div>;})`);
        const [span, div] = comp.jsxRoots.map(i => i.expressions);


        it('should find {jsxExpressions}', () => {
            expect(comp.jsxRoots).to.have.length(2);
            expect(span).to.have.length(0);
            expect(div).to.have.length(2);
        });

        it('should find dynamic expression and their dependencies', () => {
            const dynamicExpression = div[0];
            expect(dynamicExpression.dependencies).to.have.length(1);
            expect(dynamicExpression.dependencies[0]).to.deep.equal(comp.usedProps[0]);
            expect(dynamicExpression.expression).to.equal('props.name');
        });

        it('should find static expressions', () => {
            const staticExpression = div[1];
            expect(staticExpression.dependencies).to.deep.equal([]);
            expect(staticExpression.expression).to.equal('3');
        });

        it('should find properties with expressions', () => {
            const { ast, comp } = getCompDef(`TSXAir(props => (<span att="3" exp={props.name}>!</span>)`);
            const propValue = find(ast, i => ts.isPropertyAccessExpression(i));
            const prop = comp.jsxRoots[0].expressions[0];

            expect(prop).to.deep.include({
                kind: 'JsxExpression',
                expression: 'props.name'
            });
            expect(prop.dependencies[0]).to.deep.equal(comp.usedProps[0]);
            expect(prop.sourceAstNode.parent.kind).to.equal(ts.SyntaxKind.JsxAttribute);
        });
    });
});