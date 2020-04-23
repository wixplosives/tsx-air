import ts from 'typescript';
import { expect } from 'chai';
import { getCompDef } from './test.helpers';
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
            expect(dynamicExpression.expression).to.equal('props.name');
        });

        describe('variables', () => {
            it('should find and aggregate used variables', () => {
                const { comp } = getCompDef(`const Comp = TSXAir(props => { 
                    return <div>{props.expression}</div>;})`);

                const expression = comp.jsxRoots[0].expressions[0];
                const expectedUsedVars = {
                    accessed: {
                        props: {
                            expression: {}
                        }
                    },
                    read:{
                        props: {
                            expression: {}
                        }
                    },
                    defined: {},
                    modified: {}
                };

                expect(expression.variables, 'expression access not found').to.eql(expectedUsedVars);
                expect(expression.aggregatedVariables, 'expression access not found').to.eql(expectedUsedVars);
                expect(comp.aggregatedVariables, 'expression access is aggregated').to.eql({ ...expectedUsedVars, defined: { props: {} } });
                expect(comp.variables, 'comp has only one variable (defines props)').to.eql({ accessed: {}, read:{}, defined: { props: {} }, modified: {} });
            });

            it('should aggregate defined and used variable', () => {
                const { comp } = getCompDef(`const Comp = TSXAir(props => { 
                    props.wasModified = true;
                return <div>{props.expression0}{props.expression1}</div>;})`);

                expect(comp.variables, 'comp has only one variable (defines props)').to.eql({
                    accessed: {
                        props: { wasModified: {} }
                    },
                    read:{},
                    defined: { props: {} },
                    modified: {
                        props: { wasModified: {} }
                    }
                });
                expect(comp.aggregatedVariables).to.eql({
                    accessed: {
                        props: {
                            expression0: {},
                            expression1: {},
                            wasModified: {}
                        }
                    },
                    read: {
                        props: {
                            expression0: {},
                            expression1: {},
                        }
                    },
                    defined: { props: {} },
                    modified: {
                        props: { wasModified: {} }
                    }
                });
            });

            it('should find variables used inside component nodes', () => {
                const { comp } = getCompDef(`const Comp = TSXAir(props => { 
                return <div>
                    <AComp title={props.title}>{props.children}</AComp>
                </div>;})`);

                const expectedCompVariables = {
                    accessed: {
                        props: {
                            title: {},
                            children: {}
                        }
                    },
                    read: {
                        props: {
                            title: {},
                            children: {}
                        }
                    },
                    defined: {},
                    modified: {}
                };
                const expectedChildrenVariables = {
                    accessed: {
                        props: {
                            children: {}
                        }
                    },
                    read: {
                        props: {
                            children: {}
                        }
                    },
                    defined: {},
                    modified: {}
                };
                expect(comp.jsxRoots[0].components[0].aggregatedVariables, 'Component jsx node aggregated variables').to.eql(expectedCompVariables);
                expect(comp.jsxRoots[0].components[0].variables, 'Component jsx node variables').to.eql(expectedCompVariables);
                expect(comp.jsxRoots[0].components[0].children!.variables, 'Component children variables').to.eql(expectedChildrenVariables);
                expect(comp.jsxRoots[0].components[0].children!.aggregatedVariables, 'Component children aggregated variables').to.eql(expectedChildrenVariables);
            });
        });

        it('should find static expressions', () => {
            const { comp } = getCompDef(`const Comp = TSXAir(props => { 
                return <div>{3}</div>;})`);

            const staticExpression = comp.jsxRoots[0].expressions[0];
            expect(staticExpression.expression).to.equal('3');
        });

        it('should find attributes with expressions', () => {
            const { comp } = getCompDef(`const Comp=TSXAir(props => (<span att="3" exp={props.name}>!</span>)`);
            const prop = comp.jsxRoots[0].expressions[0];

            expect(prop).to.deep.include({
                kind: 'JsxExpression',
                expression: 'props.name'
            });
            expect(prop.sourceAstNode.parent.kind).to.equal(ts.SyntaxKind.JsxAttribute);
        });

        it('should handle jsx text expressions trivial value', () => {
            const { comp } = getCompDef(`const Comp=TSXAir(props => (<span>{/* trivial expression */}</span>)`);

            expect(comp.jsxRoots[0].expressions).to.eql([]);
        });
    });
});