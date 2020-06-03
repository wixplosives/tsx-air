import { Component, CompFactory, Fragment, Factory } from "../types";
import { store } from "../api/store";
import { TSXAir } from "..";
import { VirtualElement } from "../types/virtual.element";

// const MockParent = TSXAir((props: { a: number }) => {
//     const state = store({ counter: 0 });
//     if (props.a < 0) {
//         return <span>{props.a}</span>
//     }
//     if (props.a<5) {
//         return <MockParent a={props.a +1} />
//     }
//     return <MockChild ca={props.a} cb={state.counter} />
// });

// const MockChild_ = TSXAir((props: { ca: number, cb: number }) => {
//     return <div>{props.ca} {props.cb}</div>;
// });

export class Parent extends Component {
    hydrate(preRendered: VirtualElement<typeof Parent>, target: HTMLElement): void {
        this.ctx.root = TSXAir.runtime.hydrate(preRendered, target);
    }

    static factory = new CompFactory<Parent>(Parent, {
        'props.a': 1,
        'state.counter': 2
    }, () => ({ state: { counter: 0 } }));

    $preRender(): VirtualElement<any> {
        TSXAir.runtime.updateState(this, ({ state }) => {
            state.counter++;
            return this.changesBitMap['state.counter'];
        });
        if (this.props.a < 0) {
            return VirtualElement.fragment('ret0', ParentFrag0, this);
        }
        if (this.props.a < 5) {
            return VirtualElement.component('ret1', Parent, this, undefined, { a: this.props.a + 1 });
        }
        return VirtualElement.component(
            'ret2', MockChild, this,
            new Map<number, number>([
                [this.changesBitMap['state.counter'], MockChild.factory.changesBitMap['props.ca']],
                [this.changesBitMap['props.a'], MockChild.factory.changesBitMap['props.cb']],
            ]), { ca: this.props.a, cb: this.state.state.counter });
    }

    dispose(): void {
    }
}

export class ParentFrag0 extends Fragment {
    static factory = new Factory<ParentFrag0>(
        ParentFrag0, Parent.factory.changesBitMap);
    $updateView(changes: number): void {
        if (changes & this.changesBitMap['props.a']) {
            TSXAir.runtime.updateExpression(this.ctx.expressions[0], this.props.a);
        }
    }

    dispose(): void {
    }

    hydrate(_preRender: VirtualElement<any>, target: HTMLElement): void {
        const exp0 = TSXAir.runtime.hydrateExpression(this.props.a, target.childNodes[0] as Comment);
        this.ctx.expressions = [exp0];
        this.ctx.root = target;
    }

    toString(): string {
        return `<span><!--exp0-->${TSXAir.runtime.toString(this.props.a)}<!--/exp0--></span>`
    }
}


export class MockChild extends Component {
    static factory = new CompFactory<MockChild>(MockChild, {
        'props.ca': 4, 'props.cb': 8
    });

    hydrate(preRendered: VirtualElement<typeof MockChild>, target: HTMLElement): void {
        this.ctx.root = TSXAir.runtime.hydrate(preRendered, target);
    }
    $preRender(): VirtualElement<typeof MockChildFrag0> {
        return VirtualElement.fragment('ret0', MockChildFrag0, this);
    }
    dispose(): void {
    }
}

export class MockChildFrag0 extends Fragment {
    static factory = new Factory<MockChildFrag0>(
        MockChildFrag0, MockChild.factory.changesBitMap);
    $updateView(changes: number): void {
        if (changes & this.changesBitMap['props.ca']) {
            TSXAir.runtime.updateExpression(this.ctx.expressions[0], this.props.ca);
        }
        if (changes & this.changesBitMap['props.cb']) {
            TSXAir.runtime.updateExpression(this.ctx.expressions[1], this.props.cb);
        }
    }

    dispose(): void {
    }

    hydrate(_preRender: VirtualElement<any>, target: HTMLElement): void {
        const exp0 = TSXAir.runtime.hydrateExpression(this.props.ca, target.childNodes[0] as Comment);
        const exp1 = TSXAir.runtime.hydrateExpression(this.props.cb, exp0.end.nextSibling?.nextSibling as Comment);
        this.ctx.expressions = [exp0, exp1];
        this.ctx.root = target;
    }

    toString(): string {
        return `<div><!--exp0-->${TSXAir.runtime.toString(this.props.ca)}<!--/exp0--> <!--exp1-->${TSXAir.runtime.toString(this.props.cb)}<!--/exp1--></div>`
    }
}

