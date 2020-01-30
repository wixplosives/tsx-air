import { Component } from '@tsx-air/framework';
import { TSXAir } from '@tsx-air/framework';

export class comp extends Component {
    constructor() {
        super(...arguments);
        this.$$processUpdate = function (props, state, changeMap) { };
    }
}

comp.factory = {
    toString: () => `<div></div>`,
    hydrate: (root, props) => new comp({
        root: root
    }, props),
    initialState: () => ({})
};
comp.changeBitmask = {
};

