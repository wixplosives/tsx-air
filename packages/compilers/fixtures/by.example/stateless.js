import { Component } from '@tsx-air/framework';
import { TSXAir } from '@tsx-air/framework';
export class Comp extends Component {
    constructor() {
        super(...arguments);
        this.$$processUpdate = (props, __1, changeMap) => {
            if (changeMap & Comp.changeBitmask['props.a']) {
                this.context.exp0.textContent = props.a;
            }
        };
    }
}
Comp.factory = {
    toString: props => `<div><!-- props.a -->${props.a}<!-- --></div>`,
    hydrate: (root, props, state) => new Comp({
        root: root,
        exp0: root.childNodes[1]
    }, props, state),
    initialState: () => ({})
};

Comp.changeBitmask = {
    'props.a': 1 << 0
};
