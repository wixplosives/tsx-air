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
    toString: (props, state) => `<div><!-- state.state1.a -->${state.state1.a}<!-- state.state1.a --></div>`,
    hydrate: (root, props) => new comp({
        root: root,
        exp0: root.childNodes[1]
    }, props),
    initialState: (props) => ({ a: 'initial' })
};
comp.changeBitmask = {
    state1_a: 1 << 0
};
