import { expect } from 'chai';
import { getCompDef } from './component.definition.test';
// tslint:disable: no-unused-expression
// tslint:disable: no-shadowed-variable

describe('TSXAir component analyzer: functions', () => {
    it('should find all the inner functions', () => {
        const { comp } = getCompDef(`const Comp = TSXAir(props=>{ 
                const aHandler = ()=>console.log(props.message);
                return <div>{
                    props.images.map(src=><img alt={props.alt} src={src}/>)
                    }</div>
            });`
        );

        expect(comp.jsxRoots).to.have.length(1);
        expect(comp.functions.length).to.eql(2);

        const aHandler = comp.functions[0];
        const aRepeater = comp.functions[1];
        expect(aHandler.arguments).to.eql([]);
        expect(aHandler.jsxRoots).to.eql([]);
        expect(aHandler.variables).to.eql({
            accessed: {
                props: {
                    message: {}
                },
                console: {
                    log: {}
                }
            },
            defined: {},
            modified: {}
        });
        expect(aRepeater.arguments).to.eql(['src']);
        expect(aRepeater.jsxRoots.length).to.eql(1);
        expect(aRepeater.variables).to.eql({
            accessed: {},
            defined: { src: {} },
            modified: {}
        });
        expect(aRepeater.aggregatedVariables).to.eql({
            accessed: {
                src: {},
                props: {
                    alt: {}
                }
            },
            defined: { src: {} },
            modified: {}
        });
    });
});