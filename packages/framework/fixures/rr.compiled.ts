class span0 extends Fragment {
    static factory = new Factory(Parent.span0, Parent.changesBitMap);
    updateView($ch) {
        const { props } = this;
        const $b = this.changesBitMap
        if ($ch & ($b["props.props"]))
            TSXAir.runtime.updateExpression(this.ctx.expressions[0], props.a)
    }
    toString() {
        const { props } = this;
        return `<span>
            <!--C-->${TSXAir.runtime.toString(this.$Child0)}<!--C-->
            <!--X-->${TSXAir.runtime.toString(props.a)}<!--X-->
        </span>`;
    }
    hydrate(_, t) {
        const { props } = this;
        this.hydrateExpressions([props.a], t)
        this.hydrateComponents([this.$Child0], t)
        this.ctx.root = t
    }
    get $Child0() {
        const { props } = this;
        const $pr = this.changesBitMap, $ch = Child.changesBitMap
        return VirtualElement.component("0", Child, this, new Map([[$ch["props.ca"], $pr["props.a"]], [$ch["props.cb"], $pr["props.a"]]]), { ca: props.a, cb: -props.a });
    }
}
Parent.span0=span0
export class Parent extends Component {
    static factory = new CompFactory(Parent, { "props.a": 1, "state.counter": 2 }, props => ({
        "state": { counter: 0 }
    }));
    preRender() {
        const { props } = this;
        if (props.a < 0) {
            return VirtualElement.fragment("0", Parent.span0, this);
        }
        if (props.a < 5) {
            return this.$Parent1;
        }
        return this.$Child2;
    }
    get $Parent1() {
        const { props } = this;
        return VirtualElement.component("1", Parent, this, undefined, { a: props.a + 1 });
    }
    get $Child2() {
        const { props } = this;
        const { state } = this.state;
        const $pr = this.changesBitMap, $ch = Child.changesBitMap
        return VirtualElement.component("2", Child, this, new Map([[$ch["props.ca"], $pr["props.a"]], [$ch["props.cb"], $pr["state.counter"]]]), { ca: props.a, cb: state.counter });
    }
}
class div0 extends Fragment {
    static factory = new Factory(Child.div0, Child.changesBitMap);
    updateView($ch) {
        const { props } = this;
        const $b = this.changesBitMap
        if ($ch & ($b["props.props"]))
            TSXAir.runtime.updateExpression(this.ctx.expressions[0], props.ca)
        if ($ch & ($b["props.props"]))
            TSXAir.runtime.updateExpression(this.ctx.expressions[1], props.cb)
    }
    toString() {
        const { props } = this;
        return `<div><!--X-->${TSXAir.runtime.toString(props.ca)}<!--X--> <!--X-->${TSXAir.runtime.toString(props.cb)}<!--X--></div>`;
    }
    hydrate(_, t) {
        const { props } = this;
        this.hydrateExpressions([props.ca, props.cb], t)
        this.ctx.root = t
    }
}
Child.div0=div0
export class Child extends Component {
    static factory = new CompFactory(Child, { "props.ca": 1, "props.cb": 2 }, () => ({}));
    preRender() {
        return VirtualElement.fragment("0", Child.div0, this);
    }
}
