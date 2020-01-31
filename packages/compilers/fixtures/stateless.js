import { Component } from '@tsx-air/framework';
import { TSXAir } from '@tsx-air/framework';
export class comp extends Component {
    constructor() {
        super(...arguments);
        this.$$processUpdate = (props, __1, changeMap) => {
            if (changeMap & comp.changeBitmask.a) {
                this.context.exp0.textContent = props.a;
            }
        };
    }
}
comp.factory = {
    toString: props => `<div><!-- props.a -->${props.a}<!-- props.a --></div>`,
    hydrate: (root, props) => new comp({
        root: root,
        exp0: root.childNodes[1]
    }, props),
    initialState: () => ({})
};
comp.changeBitmask = {
    a: 1 << 0
};
