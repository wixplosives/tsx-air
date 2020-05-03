import { Component } from '@tsx-air/framework';
import { TSXAir, store } from '@tsx-air/framework';
export class StatefulComp extends Component {
    constructor() {
        super(...arguments);
        this.onClickA = (...args) => TSXAir.runtime.execute(this, this._onClickA, args);
        this.onClickB = (...args) => TSXAir.runtime.execute(this, this._onClickB, args);
    }
    _onClickA(props, $s) { const { state } = $s; TSXAir.runtime.updateState(this, $s, ({ state }) => {
        state.a = `${props.initialState} A (${++state.aCounter})`;
        return StatefulComp.changeBitmask["state.a"] | StatefulComp.changeBitmask["state.aCounter"];
    }) }
    _onClickB(props, $s) { const { state } = $s; TSXAir.runtime.updateState(this, $s, ({ state }) => {
        state.b = `${props.initialState} B (${++state.bCounter})`;
        return StatefulComp.changeBitmask["state.b"] | StatefulComp.changeBitmask["state.bCounter"];
    }) }
    $afterMount() { this.context.elm0.addEventListener("click", this.onClickA); this.context.elm2.addEventListener("click", this.onClickB); }
    $preRender(props, $s) {
        let $v = null;
        const { state } = $s;
        var volatile = 0;
        volatile++;
        TSXAir.runtime.updateState(this, $s, ({ state }) => {
            state.changeCount += volatile;
            return StatefulComp.changeBitmask["state.changeCount"];
        })
        $v = { volatile };
        return $v;
    }
    $updateView(props, { state }, __2, changeMap) {
        if (changeMap & StatefulComp.changeBitmask["props.initialState"]) { }
        if (changeMap & StatefulComp.changeBitmask["state.a"]) {
            this.context.exp1.textContent = state.a
        }
        if (changeMap & StatefulComp.changeBitmask["state.b"]) {
            this.context.exp3.textContent = state.b
        }
        if (changeMap & StatefulComp.changeBitmask["state.changeCount"]) {
            this.context.exp4.textContent = state.changeCount
        }
    }
}
StatefulComp.factory = {
    "toString": (props, $s) => {
        const $v = TSXAir.runtime.toStringPreRender(StatefulComp, props, $s);
        const { state } = $s;
        let { volatile } = $v;
        return `<div>
            <div class="btn">
                <!-- state.a -->${state.a}<!-- -->
            </div>
            <div class="btn">
                <!-- state.b -->${state.b}<!-- -->
            </div>
            <div class="changeCount">View rendered <!-- state.changeCount -->${state.changeCount}<!-- --> times</div>
            <!-- empty expression -->${true}<!-- -->
            <div class="volatile">volatile variable is still at <!-- volatile -->${volatile}<!-- --></div>
        </div>`;
    },
    "hydrate": (root, props, state) => new StatefulComp({
        "root": root,
        "elm0": root.children[0],
        "exp1": root.children[0].childNodes[2],
        "elm2": root.children[1],
        "exp3": root.children[1].childNodes[2],
        "exp4": root.children[2].childNodes[2],
        "exp5": root.childNodes[8],
        "exp6": root.children[3].childNodes[2]
    }, props, state),
    "initialState": props => ({
        "state": {
            a: props.initialState + "A",
            b: props.initialState + "B",
            aCounter: 0,
            bCounter: 0,
            changeCount: 0
        }
    })
};
StatefulComp.changeBitmask = {
    "props.initialState": 1 << 0,
    "state.a": 1 << 1,
    "state.b": 1 << 2,
    "state.changeCount": 1 << 3
};
//# sourceMappingURL=index.source.jsx.map