import { Component } from '@tsx-air/framework';
import { TSXAir, store } from '@tsx-air/framework';
export class Comp extends Component {
    constructor() {
        super(...arguments);
        this.$$processUpdate = (__0, { store1 }, changeMap, externalUpdatesCount) => {
            if (changeMap & Comp.changeBitmask['store1.a']) {
                this.context.exp0.textContent = store1.a;
            }
        };
    }
}
Comp.factory = {
    toString: (__0, { store1 }) => `<div><!-- store1.a -->${store1.a}<!-- --></div>`,
    hydrate: (root, props, state) => new Comp({
        root: root,
        exp0: root.childNodes[1]
    }, props, state),
    initialState: () => ({
        store1: { a: 'initial' }
    })
};
Comp.changeBitmask = {
    'store1.a': 1 << 0
};
