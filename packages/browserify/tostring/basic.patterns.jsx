import { Component } from '@tsx-air/framework';
import { TSXAir, store } from '@tsx-air/framework';
export class Static extends Component {
    constructor() {
        super(...arguments);
        this.$$processUpdate = () => { };
    }
}
Static.factory = {
    "toString": () => `<div></div>`,
    "hydrate": (root, props, state) => new Static({
        "root": root
    }, props, state),
    "initialState": () => ({})
};
Static.changeBitmask = {};
export class PropsOnly extends Component {
    constructor() {
        super(...arguments);
        this.$$processUpdate = (props, __1, changeMap, externalUpdatesCount) => { if (changeMap & PropsOnly.changeBitmask["props.a"]) {
            this.context.exp0.textContent = props.a;
        } if (changeMap & PropsOnly.changeBitmask["props.b"]) {
            this.context.exp1.textContent = props.b;
        } };
    }
}
PropsOnly.factory = {
    "toString": props => `<div><!-- props.a -->${props.a}<!-- --><!-- props.b -->${props.b}<!-- --></div>`,
    "hydrate": (root, props, state) => new PropsOnly({
        "root": root,
        "exp0": root.childNodes[1],
        "exp1": root.childNodes[4]
    }, props, state),
    "initialState": () => ({})
};
PropsOnly.changeBitmask = {
    "props.a": 1 << 0,
    "props.b": 1 << 1
};
export class StateOnly extends Component {
    constructor() {
        super(...arguments);
        this.$$processUpdate = (__0, { store1 }, changeMap, externalUpdatesCount) => { if (changeMap & StateOnly.changeBitmask["store1.a"]) {
            this.context.exp0.textContent = store1.a;
        } if (changeMap & StateOnly.changeBitmask["store1.b"]) {
            this.context.exp1.textContent = store1.b;
        } };
    }
}
StateOnly.factory = {
    "toString": (__0, { store1 }) => `<div><!-- store1.a -->${store1.a}<!-- --><!-- store1.b -->${store1.b}<!-- --></div>`,
    "hydrate": (root, props, state) => new StateOnly({
        "root": root,
        "exp0": root.childNodes[1],
        "exp1": root.childNodes[4]
    }, props, state),
    "initialState": () => ({
        "store1": { a: 1, b: 2 }
    })
};
StateOnly.changeBitmask = {
    "store1.a": 1 << 0,
    "store1.b": 1 << 1
};
export class ProsAndState extends Component {
    constructor() {
        super(...arguments);
        this.$$processUpdate = (props, { store2 }, changeMap, externalUpdatesCount) => { if (changeMap & ProsAndState.changeBitmask["props.b"]) {
            this.context.exp1.textContent = props.b;
        } if (changeMap & ProsAndState.changeBitmask["props.a"]) {
            this.context.exp0.textContent = props.a;
        } if (changeMap & ProsAndState.changeBitmask["store2.a"]) {
            this.context.exp2.textContent = store2.a;
        } if (changeMap & ProsAndState.changeBitmask["store2.b"]) {
            this.context.exp3.textContent = store2.b;
        } };
    }
}
ProsAndState.factory = {
    "toString": (props, { store2 }) => `<div><!-- props.a -->${props.a}<!-- --><!-- props.b -->${props.b}<!-- --><!-- store2.a -->${store2.a}<!-- --><!-- store2.b -->${store2.b}<!-- --></div>`,
    "hydrate": (root, props, state) => new ProsAndState({
        "root": root,
        "exp0": root.childNodes[1],
        "exp1": root.childNodes[4],
        "exp2": root.childNodes[7],
        "exp3": root.childNodes[10]
    }, props, state),
    "initialState": props => ({
        "store2": { a: props.b, b: 2 }
    })
};
ProsAndState.changeBitmask = {
    "props.a": 1 << 0,
    "props.b": 1 << 1,
    "store2.a": 1 << 2,
    "store2.b": 1 << 3
};
export class NestedStateless extends Component {
    constructor() {
        super(...arguments);
        this.$$processUpdate = (pr, __1, changeMap, externalUpdatesCount) => { if (changeMap & NestedStateless.changeBitmask["pr.a"]) {
            TSXAir.runtime.updateProps(this.context.PropsOnly0, p => { p.a = pr.a; p.b = pr.a; return PropsOnly.changeBitmask["props.a"] < PropsOnly.changeBitmask["props.b"]; });
        } };
    }
}
NestedStateless.factory = {
    "toString": pr => `<div>${PropsOnly.factory.toString({
        "a": pr.a,
        "b": pr.a,
        "unused": 3
    })}</div>`,
    "hydrate": (root, pr, state) => new NestedStateless({
        "root": root,
        "PropsOnly0": PropsOnly.factory.hydrate(root.children[0], {
            "a": pr.a,
            "b": pr.a,
            "unused": 3
        }, state && state.__childComps && state.__childComps.PropsOnly0)
    }, pr, state),
    "initialState": () => ({})
};
NestedStateless.changeBitmask = {
    "pr.a": 1 << 0
};
export class EventListener extends Component {
    constructor() {
        super(...arguments);
        this.$$processUpdate = () => { };
        this.onclick = () => { return console.log("ok!"); };
        this.$afterMount = () => { this.context.elm0.addEventListener("click", this.onclick); };
    }
}
EventListener.factory = {
    "toString": () => `<div></div>`,
    "hydrate": (root, props, state) => new EventListener({
        "root": root,
        "elm0": root
    }, props, state),
    "initialState": () => ({})
};
EventListener.changeBitmask = {};
export class DynamicAttributes extends Component {
    constructor() {
        super(...arguments);
        this.$$processUpdate = (props, __1, changeMap, externalUpdatesCount) => { if (changeMap & DynamicAttributes.changeBitmask["props.a"]) {
            this.context.elm0.setAttribute(lang, props.a);
        } };
    }
}
DynamicAttributes.factory = {
    "toString": props => `<div dir="${'ltr'}" lang="${props.a}"><span></span></div>`,
    "hydrate": (root, props, state) => new DynamicAttributes({
        "root": root,
        "elm0": root
    }, props, state),
    "initialState": () => ({})
};
DynamicAttributes.changeBitmask = {
    "props.a": 1 << 0
};
export class DynamicAttributesSelfClosing extends Component {
    constructor() {
        super(...arguments);
        this.$$processUpdate = (props, __1, changeMap, externalUpdatesCount) => { if (changeMap & DynamicAttributesSelfClosing.changeBitmask["props.a"]) {
            this.context.elm0.setAttribute(lang, props.a);
        } };
    }
}
DynamicAttributesSelfClosing.factory = {
    "toString": props => `<div dir="${, sto}" lang="${props.a}"></div>`,
    "hydrate": (root, props, state) => new DynamicAttributesSelfClosing({
        "root": root,
        "elm0": root
    }, props, state),
    "initialState": () => ({})
};
DynamicAttributesSelfClosing.changeBitmask = {
    "props.a": 1 << 0
};
//# sourceMappingURL=basic.patterns.jsx.map