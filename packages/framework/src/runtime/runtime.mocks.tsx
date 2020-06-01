import { Component, VirtualElement, CompFactory, Dom, Fragment } from "../types";
import { store } from "../api/store";
import { TSXAir } from "..";


const MockParent_ = TSXAir((props: { a: number }) => {
    const state = store({ counter: 0 });
    return <MockChild_ ca={props.a} cb={state.counter} />
});

const MockChild_ = TSXAir((props: { ca: number, cb: number }) => {
    return <div>{props.ca} {props.cb}</div>;
});

export class MockParent extends Component {
    static factory: CompFactory<MockParent> = {
        changesBitMap: {
            'props.a': 1,
            'state.counter': 2
        },
        hydrate: (root, props: any, state?: any) => {

        },
        initialState: (_: any) => ({}),
        newInstance: (key: string, props: any, state?: any) => new MockParent({ root: null! }, props, state || MockParent.factory.initialState(props), key, {}),
    }

    constructor(ctx: Dom, props: any, state: any, key: string, volatile: any) {
        super(ctx, props, state, key, volatile);
        // @ts-ignore
        this.changesBitMap = MockParent.factory.changesBitMap;
    }

    $preRender(): VirtualElement<MockParent> {
        TSXAir.runtime.updateState(this, ({ state }) => {
            state.counter++;
            return this.changesBitMap['state.counter'];
        });
        return new VirtualElement<MockChild>(
            MockChild, this, { ca: this.props.a, cb: this.state.counter }, {}, undefined, 0, 'root'
        )
    }

    $updateView(changes: number): void {
        if (changes & (this.changesBitMap['state.counter'] | this.changesBitMap['props.a'])) {
            TSXAir.runtime.updateProps(this.ctx.root as MockChild, (p: any) => {
                const { changesBitMap } = this.ctx.root as MockChild;
                p.ca = this.props.a;
                p.cb = this.state.counter;
                return changesBitMap['props.ca'] | changesBitMap['props.cb'];
            });
        }
    }

    toString(): string {
        return `${MockChild.toString()}`
    }

    dispose(): void {
    }
}

export class MockChildFrag0 extends Fragment {
    $updateView(changes: number): void {
        throw new Error("Method not implemented.");
    }
    toString(): string {
        return `<div><!-- exp0 -->${TSXAir.runtime.toString(this.props.ca)}<!-- /exp0 --> <!-- exp1 -->${props.cb}<!-- /exp1 --></div>`
    }
    dispose(): void {
        throw new Error("Method not implemented.");
    }
}

export class MockChild extends Component<{
    root: MockChildFrag0;
}> {
    $preRender(): VirtualElement<MockChild> {

    }
    $updateView(changes: number): void {
        if (changes & this.changesBitMap['props.ca']) {
            TSXAir.runtime.setExpValue(this.ctx.exp0, this.props.ca);
        }
        if (changes & this.changesBitMap['props.cb']) {
            TSXAir.runtime.setExpValue(this.ctx.exp1, this.props.ca);
        }
    }
    toString(): string {
    }
    dispose(): void {
    }
}