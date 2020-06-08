import { Component, CompFactory, TSXAir, Factory } from "..";
import { VirtualElement } from "../types/virtual.element";
import { Fragment } from "../types/fragment";

// const MockParent = TSXAir((props: { a: number }) => {
//     const state = store({ counter: 0 });
//     if (props.a < 0) {
//         return <span>
//             <MockChild ca={props.a} cb={-props.a} />
//             {props.a}
//         </span>
//     }
//     if (props.a < 5) {
//         return <MockParent a={props.a + 1} />
//     }
//     return <MockChild ca={props.a} cb={state.counter} />
// });


// const MockChild = TSXAir((props: { ca: number, cb: number }) => {
//     return <div>{props.ca} {props.cb}</div>;
// });

export class Parent extends Component {
    static factory: CompFactory<typeof Parent> = new CompFactory<typeof Parent>(Parent, {
        'props.a': 1,
        'state.counter': 2
    }, () => ({ state: { counter: 0 } }));

    preRender(): VirtualElement<any> {
        TSXAir.runtime.updateState(this, ({ state }) => {
            state.counter++;
            return this.changesBitMap['state.counter'];
        });
        if (this.props.a < 0) {
            return VirtualElement.fragment('0', ParentFrag0, this);
        }
        if (this.props.a < 5) {
            return VirtualElement.component('1', Parent, this, undefined, { a: this.props.a + 1 });
        }
        return VirtualElement.component(
            '2', Child, this,
            new Map<number, number>([
                [this.changesBitMap['state.counter'], Child.factory.changesBitMap['props.ca']],
                [this.changesBitMap['props.a'], Child.factory.changesBitMap['props.cb']],
            ]), { ca: this.props.a, cb: this.state.state.counter });
    }
}

export class ParentFrag0 extends Fragment {
    static factory: Factory<typeof ParentFrag0> = new Factory<typeof ParentFrag0>(
        ParentFrag0, Parent.factory.changesBitMap);
    updateView(changes: number): void {
        if (changes & this.changesBitMap['props.a']) {
            TSXAir.runtime.updateExpression(this.ctx.expressions[0], this.props.a);
        }
    }

    $comp0() {
        const { props } = this;
        return VirtualElement.component('0', Child, this,
            new Map<number, number>([[this.changesBitMap['props.a'],
            Child.factory.changesBitMap['prop.ca']
            | Child.factory.changesBitMap['prop.cb']
            ]]), { ca: props.a, cb: -props.a })
    }

    hydrate(_: any, target: HTMLElement) {
        const { props } = this;
        this.hydrateExpressions([props.a], target);
        this.hydrateComponents([this.$comp0()], target);
        this.ctx.root = target;
    }

    toString(): string {
        const r = this.unique(`<span><!--C-->${
            TSXAir.runtime.toString(this.$comp0())
        }<!--C--><!--X-->${
            TSXAir.runtime.toString(this.props.a)
            }<!--X--></span>`);
        return r;
    }
}

export class Child extends Component {
    static factory: CompFactory<typeof Child> = new CompFactory<typeof Child>(Child, {
        'props.ca': 4, 'props.cb': 8
    });

    preRender(): VirtualElement<typeof ChildFrag0> {
        return VirtualElement.fragment('0', ChildFrag0, this);
    }
}

export class ChildFrag0 extends Fragment {
    static factory: Factory<typeof ChildFrag0> = new Factory<typeof ChildFrag0>(
        ChildFrag0, Child.factory.changesBitMap);
    updateView(changes: number): void {
        if (changes & this.changesBitMap['props.ca']) {
            TSXAir.runtime.updateExpression(this.ctx.expressions[0], this.props.ca);
        }
        if (changes & this.changesBitMap['props.cb']) {
            TSXAir.runtime.updateExpression(this.ctx.expressions[1], this.props.cb);
        }
    }

    hydrate(_: any, target: HTMLElement) {
        const { props } = this;
        this.hydrateExpressions([props.ca, props.cb], target);
        this.ctx.root = target;
    }

    toString(): string {
        const r = this.unique(`<div><!--X-->${TSXAir.runtime.toString(this.props.ca)}<!--X--> <!--X-->${TSXAir.runtime.toString(this.props.cb)}<!--X--></div>`);
        return r;
    }
}