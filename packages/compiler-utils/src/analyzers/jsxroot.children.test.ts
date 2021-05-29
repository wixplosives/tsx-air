import { expect } from 'chai';
import { CompDefinition, JsxComponent } from './types';
import { getCompDef } from './test.helpers';




describe('children of Jsx components', () => {
    let comp: CompDefinition;
    let comp1: JsxComponent;
    let comp2: JsxComponent;
    let comp3: JsxComponent;
    let comp4: JsxComponent;

    beforeEach(() => {
        comp = getCompDef(`const Comp = TSXAir(function(props){ 
                    return <div>
                        <Comp1 />
                        <Comp2>
                            content
                            <div>Child</div>
                        </Comp2>
                        <Comp3 str="true" static={666} dynamic={props.name} multi={a*props.b+4}/>
                        <Comp4 str="true" static={666} dynamic={props.name} multi={a*props.b+4}>{props.child}</Comp4>
                    </div>;})`).comp as CompDefinition;
        [comp1, comp2, comp3, comp4] = comp.jsxRoots[0].components;
    });
    
    it('should not set children of childless components', () => {
        [comp1, comp3].forEach(comp => {
            expect(comp.children, comp.name + '.children').to.be.undefined;
        });
    });

    it('should analyze children as a JSX fragment', () => {
        const children = comp4.children!;

        expect(children).to.deep.include({
            kind: 'JsxFragment'
        });
        expect(children.items).to.have.length(1);
        expect(children.expressions).to.have.length(1);
        expect(children.expressions[0].expression).to.equal('props.child');
    });

    it('should handle static children', () => {
        const children = comp2.children!;
        
        expect(children).to.deep.include({
            kind: 'JsxFragment'
        });
        expect(children.items).to.have.length(3);
        // @ts-ignore
        expect(children.items[2].sourceAstNode.containsOnlyTriviaWhiteSpaces).to.be.true;
        expect(children.expressions).to.have.length(0);
        expect(children.components).to.have.length(0);
    });
});