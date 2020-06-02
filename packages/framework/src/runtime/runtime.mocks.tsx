import { Component, VirtualElement, CompFactory, Fragment, Displayable, Factory } from "../types";
import { store } from "../api/store";
import { TSXAir } from "..";

// const MockParent_ = TSXAir((props: { a: number }) => {
//     const state = store({ counter: 0 });
//     if (props.a < 0) {
//         return <span>{props.a}</span>
//     }
//     return <MockChild_ ca={props.a} cb={state.counter} />
// });

// const MockChild_ = TSXAir((props: { ca: number, cb: number }) => {
//     return <div>{props.ca} {props.cb}</div>;
// });

export class MockParent extends Component {
    hydrate(preRendered: VirtualElement, target: HTMLElement): void {
        this.ctx.root = TSXAir.runtime.hydrate(preRendered, target);
    }

    static factory = new CompFactory<MockParent>(MockParent, {
        'props.a': 1,
        'state.counter': 2
    }, () => ({ state: { counter: 0 } }));

    $preRender(): VirtualElement {
        TSXAir.runtime.updateState(this, ({ state }) => {
            state.counter++;
            return this.changesBitMap['state.counter'];
        });
        return new VirtualElement(
            MockChild, this, 'ret0',
            new Map<number, number>([
                [this.changesBitMap['state.counter'], MockChild.factory.changesBitMap['props.ca']],
                [this.changesBitMap['props.a'], MockChild.factory.changesBitMap['props.cb']],
            ]), { ca: this.props.a, cb: this.state.state.counter }
        )
    }

    $updateView(changes: number): void {
        if (changes & (this.changesBitMap['state.counter'] | this.changesBitMap['props.a'])) {
            TSXAir.runtime.updateProps(this.ctx.root as MockChild, (p: any) => {
                const { changesBitMap } = this.ctx.root as Displayable;
                p.ca = this.props.a;
                p.cb = this.state.state.counter;
                return changesBitMap['props.ca'] | changesBitMap['props.cb'];
            });
        }
    }

    dispose(): void {
    }
}

export class MockChildFrag1 extends Fragment {
    static factory = new Factory<MockChildFrag1>(
        MockChildFrag1, MockParent.factory.changesBitMap);
    $updateView(changes: number): void {
        if (changes & this.changesBitMap['props.a']) {
            TSXAir.runtime.updateExpression(this.ctx.expressions[0], this.props.a);
        }
    }

    dispose(): void {
    }

    hydrate(_preRender: VirtualElement, target: HTMLElement): void {
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

    hydrate(preRendered: VirtualElement, target: HTMLElement): void {
        this.ctx.root = TSXAir.runtime.hydrate(preRendered, target);
    }
    $preRender(): VirtualElement {
        return new VirtualElement(MockChildFrag0, this, 'ret0');
    }
    $updateView(changes: number): void {
        if (changes & (this.changesBitMap['props.ca'] | this.changesBitMap['props.cb'])) {
            TSXAir.runtime.updateProps(this.ctx.root as Displayable, () => changes);
        }
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

    hydrate(_preRender: VirtualElement, target: HTMLElement): void {
        const exp0 = TSXAir.runtime.hydrateExpression(this.props.ca, target.childNodes[0] as Comment);
        const exp1 = TSXAir.runtime.hydrateExpression(this.props.cb, exp0.end.nextSibling?.nextSibling as Comment);
        this.ctx.expressions = [exp0, exp1];
        this.ctx.root = target;
    }

    toString(): string {
        return `<div><!--exp0-->${TSXAir.runtime.toString(this.props.ca)}<!--/exp0--> <!--exp1-->${TSXAir.runtime.toString(this.props.cb)}<!--/exp1--></div>`
    }
}

