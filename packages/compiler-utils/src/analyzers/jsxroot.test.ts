import ts from 'typescript';
import { expect } from 'chai';
import { getCompDef } from './comp-definition.test';
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
        it('should find all {jsxExpressions}', () => {
            const { comp } = getCompDef(`const Comp = TSXAir(props => { 
                return <div>{props.name}{3}</div>;})`);
            expect(comp.jsxRoots[0].expressions).to.have.length(2);
        });

        it('should find dynamic expression and their dependencies', () => {
            const { comp } = getCompDef(`const Comp = TSXAir(props => { 
                return <div>{props.name}</div>;})`);

            const dynamicExpression = comp.jsxRoots[0].expressions[0];
            expect(dynamicExpression.dependencies).to.have.length(1);
            expect(dynamicExpression.dependencies[0]).to.deep.equal(comp.usedProps[0]);
            expect(dynamicExpression.expression).to.equal('props.name');
        });

        describe('variables', () => {
            it('should find and agregate used variables', () => {
                const { comp } = getCompDef(`const Comp = TSXAir(props => { 
                    return <div>{props.expression}</div>;})`);

                const expression = comp.jsxRoots[0].expressions[0];
                const expectedUsedVars = {
                    accessed: {
                        props: {
                            expression: {}
                        }
                    },
                    defined: {},
                    modified: {}
                };

                expect(expression.variables, 'expression access not found').to.eql(expectedUsedVars);
                expect(expression.agregatedVariables, 'expression access not found').to.eql(expectedUsedVars);
                expect(comp.agregatedVariables, 'expression access not aggregated').to.eql(expectedUsedVars);
                expect(comp.variables, 'comp has only one variable (defines props)').to.eql({ accessed: {}, defined: { props: {} }, modified: {} });
            });

            it('should aggregate defined and used variable', () => {
                const { comp } = getCompDef(`const Comp = TSXAir(props => { 
                    props.wasModified = true;
                return <div>{props.expression0}{props.expression1}</div>;})`);
               
                expect(comp.variables, 'comp has only one variable (defines props)').to.eql({ accessed: {}, defined: { props: {} }, modified: {} });
                expect(comp.agregatedVariables).to.equal({
                    accessed: {
                        props: {
                            expression0: {},
                            expression1: {}
                        }
                    },
                    defined: { props: {} },
                    modified: { wasModified: {} }
                });
            });
        });

        it('should find static expressions', () => {
            const { comp } = getCompDef(`const Comp = TSXAir(props => { 
                return <div>{3}</div>;})`);

            const staticExpression = comp.jsxRoots[0].expressions[0];
            expect(staticExpression.dependencies).to.deep.equal([]);
            expect(staticExpression.expression).to.equal('3');
        });

        it('should find attribiutes with expressions', () => {
            const { comp } = getCompDef(`TSXAir(props => (<span att="3" exp={props.name}>!</span>)`);
            const prop = comp.jsxRoots[0].expressions[0];

            expect(prop).to.deep.include({
                kind: 'JsxExpression',
                expression: 'props.name'
            });
            expect(prop.dependencies[0]).to.eql(comp.usedProps[0]);
            expect(prop.sourceAstNode.parent.kind).to.equal(ts.SyntaxKind.JsxAttribute);
        });

        it('should handle jsx text expressions trivial value', () => {
            const { comp } = getCompDef(`TSXAir(props => (<span>{/* trivial expression */}</span>)`);

            expect(comp.jsxRoots[0].expressions).to.eql([]);
        });
    });
});