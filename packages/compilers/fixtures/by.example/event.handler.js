import { Component } from '@tsx-air/framework';
import { TSXAir, store } from '@tsx-air/framework';
export class Comp extends Component {
    constructor() {
        super(...arguments);
        this.$$processUpdate = (__0, { state }, changeMap, externalUpdatesCount) => {
            if (changeMap & Comp.changeBitmask['state.count']) {
                this.context.exp1.textContent = state.count;
            }
        };

        this.handler = () => {
            TSXAir.runtime.updateState(this, ({ state }) => {
                state.count++;
                return Comp.changeBitmask['state.count'];
            });
        }

        this.$afterMount = () => {
            this.context.elm0.addEventListener('click', this.handler);
        }
    }
}

Comp.factory = {
    toString: (__0, { state }) => `<div><!-- state.count -->${state.count}<!-- --></div>`,
    hydrate: (root, props, state) => new Comp({
        root: root,
        elm0: root,
        exp1: root.childNodes[1]
    }, props, state),
    initialState: () => ({
        state: { count: 0 }
    })
};
Comp.changeBitmask = {
    'state.count': 1 << 0
};
