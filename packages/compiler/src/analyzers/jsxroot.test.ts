import ts from 'typescript';
import { expect } from 'chai';
import { getCompDef } from './comp-definition.test';
import { CompDefinition, JsxExpression, JsxComponent } from './types';
import { find } from '../astUtils/scanner';
// tslint:disable: no-unused-expression
// tslint:disable: no-shadowed-variable

describe('TSXAir component analyzer: Jsx', () => {

    it('should find all the jsx roots', () => {
        const { comp: c } = getCompDef(`const Comp = TSXAir(props=>{ 
                const aRandomJsx = <span>!</span>;
                return <div>{props.name}</div>;})`);
        const comp = c as CompDefinition;

        expect(comp.jsxRoots).to.have.length(2);
        const [span, div] = comp.jsxRoots.map(i => i.sourceAstNode.getText());
        expect(span).to.equal('<span>!</span>');
        expect(div).to.equal('<div>{props.name}</div>');
    });

    describe('Expressions', () => {
        const { comp: c } = getCompDef(`const Comp = TSXAir(props => { 
                const aRandomJsx = <span>!</span>;
                return <div>{props.name}{3}</div>;})`);
        const comp = c as CompDefinition;
        const [span, div] = comp.jsxRoots.map(i => i.expressions);


        it('should find {jsxExpressions}', () => {
            expect(comp.jsxRoots).to.have.length(2);
            expect(span).to.have.length(0);
            expect(div).to.have.length(2);
        });

        it('should find dynamic expression and their dependencies', () => {
            const dynamicExpression = div[0];
            expect(dynamicExpression.dependencies).to.have.length(1);
            expect(dynamicExpression.dependencies[0].name).to.equal('props.name');
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
            expect(prop.dependencies[0]).to.deep.include({
                kind: 'CompProps',
                name: 'props.name',
                sourceAstNode: propValue
            });
            expect(prop.sourceAstNode.parent.kind).to.equal(ts.SyntaxKind.JsxAttribute);
        });
    });

    describe('Jsx Components', () => {
        let comp: CompDefinition;
        let comp1: JsxComponent;
        let comp2: JsxComponent;
        let comp3: JsxComponent;
        let comp4: JsxComponent;

        beforeEach(() => {
            comp = getCompDef(`const Comp = TSXAir(function(props){ 
                    return <div>
                        <Comp1 />
                        <Comp2>content</Comp2>
                        <Comp3 str="true" static={666} dynamic={props.name} multi={a*props.b+4}/>
                        <Comp4 str="true" static={666} dynamic={props.name} multi={a*props.b+4}>{props.child}</Comp4>
                    </div>;})`).comp as CompDefinition;
            [comp1, comp2, comp3, comp4] = comp.jsxRoots[0].components;
        });

        it('should find components', () => {
            expect(comp.jsxRoots[0].components).to.have.length(4);
        });

        it('should find component properties', () => {
            [comp1, comp2].forEach(comp => {
                expect(comp.props).to.have.length(0);
            });
            [comp3, comp4].forEach(comp => {
                expect(comp.props, comp.name).to.have.length(4);
                expect(comp.props.map(p => p.name), comp.name).to.deep.equal(['str', 'static', 'dynamic', 'multi']);
                comp.props.forEach(prop => expect(prop.kind).to.equal('JsxComponentProps'));
            });
        });

        it('should analyze static properties', () => {
            [comp3, comp4].forEach(comp => {
                expect(comp.props[0].value, comp.name).to.equal('true');
                expect(comp.props[1].value, comp.name).to.deep.include({
                    kind: 'JsxExpression',
                    expression: '666'
                });
            });
        });

        it('should analyze dynamic properties', () => {
            [comp3, comp4].forEach(comp => {
                const dynamic = comp.props[2].value as JsxExpression;
                const multi = comp.props[3].value as JsxExpression;

                expect(dynamic).to.deep.include({
                    kind: 'JsxExpression',
                    expression: 'props.name'
                }, comp.name);
                expect(dynamic.dependencies, comp.name + 'dynamic dependencies count').to.have.length(1);
                expect(dynamic.dependencies[0].name, comp.name).to.equal('props.name');


                expect(multi).to.deep.include({
                    kind: 'JsxExpression',
                    expression: 'a*props.b+4'
                }, comp.name);
                expect(multi.dependencies, comp.name + 'multi dependencies count').to.have.length(2);
                expect(multi.dependencies[0].name, comp.name).to.equal('a');
                expect(multi.dependencies[1].name, comp.name).to.equal('props.b');
            });
        });
    });
});