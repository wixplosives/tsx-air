import { Component } from '@tsx-air/framework';
import { TSXAir } from '@tsx-air/framework';

export class Comp extends Component {
    $$processUpdate() {        
    }
}

Comp.factory = {
    toString: () => `<div></div>`,
    hydrate: (root, props, state) => new Comp({
        root: root
    }, props, state),
    initialState: () => ({})
};

Comp.changeBitmask = {
};