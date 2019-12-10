import { expect } from 'chai';
import { getCompDef } from './comp-definition.test';
// tslint:disable: no-unused-expression
// tslint:disable: no-shadowed-variable

describe('TSXAir component analyzer: functions', () => {
    it('should find calls to store', () => {
        const { comp } = getCompDef(`const Comp = TSXAir(props=>{ 
                const state = store({key: props.title, anotherKey: 'gaga'});
                return <div>{state.key}</div>
            });`
        );

        expect(comp.stores).to.have.length(1);

        const store = comp.stores[0];
        expect(store.name).to.equal('state');
        expect(store.keys).to.eql(['key', 'anotherKey']);
        expect(store.variables).to.eql({
            defined: {},
            accessed: {
                props: {
                    title: {}
                }
            },
            modified: {}
        });
    });
});