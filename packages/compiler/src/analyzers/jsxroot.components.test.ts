import { expect } from 'chai';
import { getCompDef } from './comp-definition.test';
import { CompDefinition, JsxExpression, JsxComponent } from './types';
// tslint:disable: no-unused-expression

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
                        <Comp3 str="true" static={666} dynamic={props.name} multi={props.a*props.b+4}/>
                        <Comp4 str="true" static={666} dynamic={props.name} multi={props.a*props.b+4}>{props.child}</Comp4>
                    </div>;})`).comp as CompDefinition;
        [comp1, comp2, comp3, comp4] = comp.jsxRoots[0].components;
    });

    it('should find components', () => {
        expect(comp.jsxRoots[0].components).to.have.length(4);
    });

    it('should find component properties', () => {
        [comp1, comp2].forEach(c => {
            expect(c.props).to.have.length(0);
        });
        [comp3, comp4].forEach(c => {
            expect(c.props, c.name).to.have.length(4);
            expect(c.props.map(p => p.name), c.name).to.deep.equal(['str', 'static', 'dynamic', 'multi']);
            c.props.forEach(prop => expect(prop.kind).to.equal('JsxComponentProps'));
        });
    });

    it('should analyze static properties', () => {
        [comp3, comp4].forEach(c => {
            expect(c.props[0].value, c.name).to.equal('true');
            expect(c.props[1].value, c.name).to.deep.include({
                kind: 'JsxExpression',
                expression: '666'
            });
        });
    });

    it ('should analyze comp dependencies', () => {
        expect(comp3.dependencies.map(d => d.name)).to.deep.equal(['name', 'a', 'b',]);
        expect(comp4.dependencies.map(d => d.name)).to.deep.equal(['name', 'a', 'b', 'child']);
    });

    it('should analyze dynamic properties', () => {
        [comp3, comp4].forEach(c => {
            const dynamic = c.props[2].value as JsxExpression;
            const multi = c.props[3].value as JsxExpression;

            expect(dynamic).to.deep.include({
                kind: 'JsxExpression',
                expression: 'props.name'
            }, c.name);
            expect(dynamic.dependencies, c.name + ' dynamic dependencies count').to.have.length(1);
            expect(dynamic.dependencies[0].name, c.name).to.equal('name');

            expect(multi).to.deep.include({
                kind: 'JsxExpression',
                expression: 'props.a*props.b+4'
            }, c.name);

            expect(multi.dependencies.map(d => d.name), comp.name + ' multi dependencies count').to.deep.equal(['a','b']);

            // TODO: Add support for non-props dependencies
        });
    });
});