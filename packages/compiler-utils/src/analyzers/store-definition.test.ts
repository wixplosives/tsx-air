import { expect } from 'chai';
import { getCompDef } from './test.helpers';
import { withNoRefs } from '..';



describe('TSXAir component analyzer: stores', () => {
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
        expect(withNoRefs(store.variables)).to.eql({
            defined: {},
            executed:{},
            accessed: {
                props: {
                    title: {}
                }
            },
            read: {
                props: {
                    title: {}
                }
            },
            modified: {}
        });
    });
});