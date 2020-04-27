import { Component } from '@tsx-air/framework';
import { store, TSXAir } from '@tsx-air/framework';

export class NamedFunction extends Component {
    constructor() {
        super(...arguments);
        this.getDisplayedStr = (...args) =>
            TSXAir.runtime.execute(this, this._getDisplayedStr, args);
    }

    _getDisplayedStr(__0, $s, $v, b) {
        const { store1 } = $s
        let { vol } = $v;
        return `${store1.a} ${vol} ${b}`;
    }
    
    $preRender(__0, $s) {
        let $v = null;
        const { store1 } = $s;
        var vol = `volatile`;
        var getDisplayedStr = this.getDisplayedStr || ((...args) =>
        NamedFunction.prototype._getDisplayedStr(__0, $s, $v, ...args));
        $v = { vol, getDisplayedStr };
        return $v;
    }
    
    $updateView(__0, { store1 }, __2, changeMap) {
        if (changeMap & NamedFunction.changeBitmask['store1.a']) {
            this.context.exp0.textContent = this.getDisplayedStr('param');
        }
    };
}

NamedFunction.factory = {
    toString: (props, $s) => {
        const $v = NamedFunction.prototype.$preRender(props, state);
        let { store1 } = $s;
        let { vol, getDisplayedStr } = $v;
        return `<div><!-- getDisplayedStr('param') -->${
            NamedFunction.prototype._getDisplayedStr(props, $s, $v, 'param')
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
