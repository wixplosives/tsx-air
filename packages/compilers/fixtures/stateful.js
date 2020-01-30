import { Component } from '@tsx-air/framework';
import { TSXAir, store } from '@tsx-air/framework';
export class comp extends Component {
    constructor() {
        super(...arguments);
        this.$$processUpdate = function (props, state, changeMap) {
            if (changeMap & comp.changeBitmask.state1_a) {
                this.context.exp0.textContent = state.state1.a;
            }
        };
    }
}
comp.factory = {
    toString: (__0, state) => `<div><!-- store1.a -->${state.store1.a}<!--state1.a --></div>`,
    hydrate: (root, props) => new comp({
        root: root,
        exp0: root.childNodes[1]
    }, props),
    initialState: () => ({
        store1: { a: 'initial' }
    })
};
comp.changeBitmask = {
    store1_a: 1 << 0
};
