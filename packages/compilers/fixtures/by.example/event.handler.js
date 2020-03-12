import { Component } from '@tsx-air/framework';
import { TSXAir, store } from '@tsx-air/framework';
export class PreDefinedHandler extends Component {
    constructor() {
        super(...arguments);
        this.handler = (...args) => TSXAir.runtime.execute(this, this._handler, args);
    }

    $updateView(__0, { state }, __2, changeMap) {
        if (changeMap & PreDefinedHandler.changeBitmask['state.count']) {
            this.context.exp1.textContent = state.count;
        }
    };

    _handler(__0, $s, __2, event) {
        const { state } = $s;
        TSXAir.runtime.updateState(this, $s, ({ state }) => {
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

export class LambdaHandler extends Component {
    constructor() {
        super(...arguments);
        this.lambda0 = (...args) => TSXAir.runtime.execute(this, this._lambda0, args);
    }

    $updateView(__0, { state }, __2, changeMap) {
        if (changeMap & LambdaHandler.changeBitmask['state.count']) {
            this.context.exp1.textContent = state.count;
        }
    };

    _lambda0(__0, $s) {
        const { state } = $s;
        TSXAir.runtime.updateState(this, $s, ({ state }) => {
            state.count++;
            return LambdaHandler.changeBitmask['state.count'];
        });
    }

    $afterMount() {
        this.context.elm0.addEventListener('click', this.lambda0);
    }
}

LambdaHandler.factory = {
    toString: (__0, { state }) => `<div><!-- state.count -->${state.count}<!-- --></div>`,
    hydrate: (root, props, state) => new LambdaHandler({
        root: root,
        elm0: root,
        exp1: root.childNodes[1]
    }, props, state),
    initialState: () => ({
        state: { count: 0 }
    })
};
LambdaHandler.changeBitmask = {
    'state.count': 1 << 0
};
