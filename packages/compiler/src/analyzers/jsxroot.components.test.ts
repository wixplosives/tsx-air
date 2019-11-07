import { expect } from 'chai';
import { getCompDef } from './comp-definition.test';
import { CompDefinition, JsxExpression, JsxComponent } from './types';
// tslint:disable: no-unused-expression
// tslint:disable: no-shadowed-variable

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