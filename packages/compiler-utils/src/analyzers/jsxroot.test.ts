import ts from 'typescript';
import { expect } from 'chai';
import { getCompDef } from './test.helpers';
import { withNoRefs } from '../dev-utils';



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

        it(`treats JSX withing a expression as roots`, () => {
            const { comp } = getCompDef(`const Comp = TSXAir(props=>
                 <div>{<div />}</div>
            )`);

            expect(comp.jsxRoots).to.have.length(1);
            const outer = comp.jsxRoots[0].sourceAstNode.getText();
            expect(comp.jsxRoots[0].expressions[0].jsxRoots).to.have.length(1);
            const inner = comp.jsxRoots[0].expressions[0].jsxRoots[0].sourceAstNode.getText();
            expect(inner).to.equal('<div />');
            expect(outer).to.equal('<div>{<div />}</div>');
        });
        it(`treats conditional JSX withing a expression as roots`, () => {
            const { comp } = getCompDef(`const Comp = TSXAir(props=>
                 <div>{props.a > 0 ? <span>+</span> : <div>-</div>}</div>
            )`);

            expect(comp.jsxRoots).to.have.length(1);
            const ret = comp.jsxRoots[0].sourceAstNode.getText();
            expect(comp.jsxRoots[0].expressions[0].jsxRoots).to.have.length(2);
            const plus = comp.jsxRoots[0].expressions[0].jsxRoots[0].sourceAstNode.getText();
            const minus = comp.jsxRoots[0].expressions[0].jsxRoots[1].sourceAstNode.getText();
            expect(plus).to.equal('<span>+</span>');
            expect(minus).to.equal('<div>-</div>');
            expect(ret).to.equal('<div>{props.a > 0 ? <span>+</span> : <div>-</div>}</div>');
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
                    read: {
                        props: {
                            expression: {}
                        }
                    },
                    executed: {},
                    defined: {},
                    modified: {}
                };

                expect(withNoRefs(expression.variables), 'expression access not found').to.eql(expectedUsedVars);
                expect(withNoRefs(expression.aggregatedVariables), 'expression access not found').to.eql(expectedUsedVars);
                expect(withNoRefs(comp.aggregatedVariables), 'expression access is aggregated').to.eql({ ...expectedUsedVars, defined: { props: {} } });
                expect(withNoRefs(comp.variables), 'comp has only one variable (defines props)').to.eql({ accessed: {}, read: {}, defined: { props: {} }, modified: {}, executed: {} });
            });

            it('should aggregate defined and used variable', () => {
                const { comp } = getCompDef(`const Comp = TSXAir(props => { 
                    props.wasModified = true;
                return <div>{props.expression0}{props.expression1}</div>;})`);

                expect(withNoRefs(comp.variables), 'comp has only one variable (defines props)').to.eql({
                    executed: {},
                    accessed: {
                        props: { wasModified: {} }
                    },
                    read: {},
                    defined: { props: {} },
                    modified: {
                        props: { wasModified: {} }
                    }
                });
                expect(withNoRefs(comp.aggregatedVariables)).to.eql({
                    executed: {},
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
                    executed: {},
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
                    executed: {},
                    defined: {},
                    modified: {}
                };
                const comps = comp.jsxRoots[0].components[0];
                expect(withNoRefs(comps.aggregatedVariables), 'Component jsx node aggregated variables').to.eql(expectedCompVariables);
                expect(withNoRefs(comps.variables), 'Component jsx node variables').to.eql(expectedCompVariables);
                expect(withNoRefs(comps.children!.variables), 'Component children variables').to.eql(expectedChildrenVariables);
                expect(withNoRefs(comps.children!.aggregatedVariables), 'Component children aggregated variables').to.eql(expectedChildrenVariables);
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