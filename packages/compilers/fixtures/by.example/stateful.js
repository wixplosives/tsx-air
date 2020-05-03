import { Component } from '@tsx-air/framework';
import { TSXAir, store } from '@tsx-air/framework';
export class Comp extends Component {
    $updateView(__0, { store1 }, __2, changeMap) {
        if (changeMap & Comp.changeBitmask['store1.a']) {
            this.context.exp0.textContent = store1.a;
        }
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

export class WithVolatile extends Component {
    $preRender(__0, $s) {
        let $v = null;
        const { store1 } = $s;
        var vol = `volatile`;
        $v = { vol };
        return $v;
    }
    
    $updateView(__0, { store1 }, __2, changeMap) {
        if (changeMap & WithVolatile.changeBitmask['store1.a']) {
            this.context.exp0.textContent = store1.a;
        }
    }
}

WithVolatile.factory = {
    toString: (__0, $s) => {
        const $v =  TSXAir.runtime.toStringPreRender(WithVolatile, __0, $s)
        const { store1 } = $s;
        let { vol } = $v;
        return `<div><!-- store1.a -->${store1.a}<!-- --> <!-- vol -->${vol}<!-- --></div>`;
    },

    hydrate: (root, props, state) => new WithVolatile({
        root: root,
        exp0: root.childNodes[1],
        exp1: root.childNodes[5]
    }, props, state),

    initialState: () => ({
        store1: { a: 'initial' }
    })
};

WithVolatile.changeBitmask = {
    'store1.a': 1 << 0
};
