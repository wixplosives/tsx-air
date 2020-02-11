import { Component } from '@tsx-air/framework';
import { TSXAir } from '@tsx-air/framework';

export class comp extends Component {
    constructor() {
        super(...arguments);
        this.$$processUpdate = () => { };
    }
}

comp.factory = {
    toString: () => `<div></div>`,
    hydrate: (root, props, state) => new comp({
        root: root
    }, props, state),
    initialState: () => ({})
};

comp.changeBitmask = {
};