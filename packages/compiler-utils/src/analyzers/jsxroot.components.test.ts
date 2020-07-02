import { expect } from 'chai';
import { getCompDef } from './test.helpers';
import { CompDefinition, JsxExpression, JsxComponent } from './types';
import { isJsxAttribute } from './types.is.type';
// tslint:disable: no-unused-expression

describe('Jsx Components', () => {
    let comp: CompDefinition;
    let comp1: JsxComponent;
    let comp2: JsxComponent;
    let comp2i2: JsxComponent;
    let comp3: JsxComponent;
    let comp4: JsxComponent;
    let comp5: JsxComponent;

    beforeEach(() => {
        comp = getCompDef(`const Comp = TSXAir(function(props){ 
                    return <div>
                        <Comp1 />
                        <Comp2>content</Comp2>
                        <Comp2>other instance</Comp2>
                        <Comp3 str="true" static={666} dynamic={props.name} multi={props.a*props.b+4}/>
                        <Comp4 str="true" static={666} dynamic={props.name} multi={props.a*props.b+4}>{props.child}</Comp4>
                        <Comp5 noValue />
                    </div>;})`).comp as CompDefinition;
        [comp1, comp2, comp2i2, comp3, comp4, comp5] = comp.jsxRoots[0].components;
    });

    it('should find components', () => {
        expect(comp.jsxRoots[0].components).to.have.length(6);
    });

    it('should find component properties', () => {
        [comp1, comp2, comp2i2].forEach(c => {
            expect(c.props).to.have.length(0);
        });
        [comp3, comp4].forEach(c => {
            expect(c.props, c.name).to.have.length(4);
            expect(c.props.map(p => p.name), c.name).to.deep.equal(['str', 'static', 'dynamic', 'multi']);
            c.props.forEach(prop => expect(isJsxAttribute(prop)).to.be.true);
        });
        expect(comp5.props[0].value).to.be.true;
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

    it('should analyze dynamic properties', () => {
        [comp3, comp4].forEach(c => {
            const dynamic = c.props[2].value as JsxExpression;
            const multi = c.props[3].value as JsxExpression;

            expect(dynamic).to.deep.include({
                kind: 'JsxExpression',
                expression: 'props.name'
            }, c.name);

            expect(multi).to.deep.include({
                kind: 'JsxExpression',
                expression: 'props.a*props.b+4'
            }, c.name);
        });
    });
});