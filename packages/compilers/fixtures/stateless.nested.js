import { Component } from '@tsx-air/framework';
import { TSXAir } from '@tsx-air/framework';

export class Child extends Component {
    constructor() {
        super(...arguments);
        this.$$processUpdate = (props, __1, changeMap) => {
            if (changeMap & comp.changeBitmask['props.b']) {
                this.context.exp0.textContent = props.b;
            }
        };
    }
}
Child.factory = {
    toString: props => `<div><!-- props.b -->${props.b}<!-- props.b --></div>`,
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
    constructor() {
        super(...arguments);
        this.$$processUpdate = (props, __1, changeMap) => {
            if (changeMap & comp.changeBitmask['props.a']) {
                runtime.updateProps(this.context.childComp1, p => {
                    p.b = props.a;
                    return Child.changeBitmask['props.b'];
                });
            }
        };
    }
}

Parent.factory = {
    toString: props => `${Child.factory.toString({
        b: props.a
    })}`,
    hydrate: (root, props, state) => new Parent({
        root: root,
        childComp0: Child.factory.hydrate({
            root: root.children[0]
        }, {b: props.a}, state.__childComps.childComp1)
    }, props, state),
    initialState: () => ({})
};

Parent.changeBitmask = {
    'props.a': 1 << 0
};
