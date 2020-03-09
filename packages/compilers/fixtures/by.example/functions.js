import { Component } from '@tsx-air/framework';
import { store, TSXAir } from '@tsx-air/framework';

export class NamedFunction extends Component {
    constructor() {
        super(...arguments);
        this.getDisplayedStr = b => TSXAir.runtime.execute(
            this, this._getDisplayedStr, b
        );
    }
    $preRender(__0, { store1 }) {
        var vol = `volatile`;
        return { vol };
    }

    static $preRender(props, state) {
        let vol = `volatile`;
        let getDisplayedStr = 
        (...args) => NamedFunction.prototype._getDisplayedStr(props, state, ...args)
        return { vol, getDisplayedStr };
    }

    $updateView(__0, { store1 }, __2, changeMap) {
        if (changeMap & NamedFunction.changeBitmask['store1.a']) {
            this.context.exp1.textContent = this.getDisplayedStr('param');
        }
    };

    _getDisplayedStr(__0, { store1 }, { vol }, b) {
        return `${store1.a} ${vol} ${b}`;
    }
}

NamedFunction.factory = {
    toString: (props, state) => {
        const volatile = NamedFunction.$preRender(props, state);
        let { store1 } = state;
        let { vol, getDisplayedStr } = volatile;
        return `<div><!-- getDisplayedStr('param') -->${
                getDisplayedStr('param')
            }<!-- --></div>`;
    },
    hydrate: (root, props, state) => new NamedFunction({
        root: root,
        exp0: root.childNodes[1]
    }, props, state),
    initialState: () => ({
        store1: { a: 'initial' }
    })
};
NamedFunction.changeBitmask = {
    'store1.a': 1 << 0
};
