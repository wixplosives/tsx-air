import { Component } from '@tsx-air/framework';
import { TSXAir } from '@tsx-air/framework';

export class Child extends Component {
    $$processUpdate(props, __1, changeMap, externalUpdatesCount) {
        if (changeMap & Child.changeBitmask['props.b']) {
            this.context.exp0.textContent = props.b;
        }
    }
}
Child.factory = {
    toString: props => `<div><!-- props.b -->${props.b}<!-- --></div>`,
    hydrate: (root, props, state) => new Child({
        root: root,
        exp0: root.childNodes[1]
    }, props, state),
    initialState: () => ({})
};

Child.changeBitmask = {
    'props.b': 1 << 0
};

export class Parent extends Component {
    $$processUpdate(props, __1, changeMap, externalUpdatesCount) {
        if (changeMap & Parent.changeBitmask['props.a']) {
            TSXAir.runtime.updateProps(this.context.Child0, p => {
                p.b = props.a;
                return Child.changeBitmask['props.b'];
            });
        }
    }
}

Parent.factory = {
    toString: props => `<div>${Child.factory.toString({
        b: props.a
    })}</div>`,
    hydrate: (root, props, state) => new Parent({
        root: root,
        Child0: Child.factory.hydrate(
            root.children[0],
            {
                b: props.a
            },
            state && state.__childComps && state.__childComps.Child0)
    }, props, state),
    initialState: () => ({})
};

Parent.changeBitmask = {
    'props.a': 1 << 0
};
