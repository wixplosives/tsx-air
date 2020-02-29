import { Component } from '@tsx-air/framework';
import { TSXAir, store } from '@tsx-air/framework';
export class PreDefinedHandler extends Component {
    constructor() {
        super(...arguments);
        this.handler = this._handler.bind(this);
    }

    $updateView(__0, { state }, __2, changeMap) {
        if (changeMap & PreDefinedHandler.changeBitmask['state.count']) {
            this.context.exp1.textContent = state.count;
        }
    };

    _handler() {
        TSXAir.runtime.updateState(this, ({ state }) => {
            state.count++;
            return PreDefinedHandler.changeBitmask['state.count'];
        });
    }

    $afterMount() {
        this.context.elm0.addEventListener('click', this.handler);
    }
}

PreDefinedHandler.factory = {
    toString: (__0, { state }) => `<div><!-- state.count -->${state.count}<!-- --></div>`,
    hydrate: (root, props, state) => new PreDefinedHandler({
        root: root,
        elm0: root,
        exp1: root.childNodes[1]
    }, props, state),
    initialState: () => ({
        state: { count: 0 }
    })
};
PreDefinedHandler.changeBitmask = {
    'state.count': 1 << 0
};
