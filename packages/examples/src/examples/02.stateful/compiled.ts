import { Component, Factory, runtime, runtimeUtils, render } from '@wixc3/tsx-air-framework';

/* tslint:disable:rule no-bitwise */

// Inferred from the TSX all possible return values 
interface StatefulCompCtx { root: HTMLElement; div1: HTMLDivElement; div2: HTMLDivElement; div3: HTMLDivElement; }

interface StatefulCompProps { initialState: string; }
// All the component scope vars [possibly only those who are bound to the view]
interface StatefulCompState { a: string; b: string; changeCount: number; }

class StatefulComp extends Component<StatefulCompCtx, StatefulCompProps, StatefulCompState> {
    public static factory: Factory<StatefulComp>;
    public static readonly changeBitmask = {
        initialState: 1 << 0,
        a: 1 << 1,
        b: 1 << 2,
        changeCount: 1 << 3
    };

    public $$processUpdate(_: StatefulCompProps, newState: StatefulCompState, changeMap: number): void {
        if (changeMap !== StatefulComp.changeBitmask.changeCount) {
            runtime.updateState(this as StatefulComp, (s: StatefulCompState) => {
                s.changeCount++;
                return StatefulComp.changeBitmask.changeCount;
            });
        }

        runtimeUtils.handleChanges(new Map<number, () => void>(
            [
                [StatefulComp.changeBitmask.initialState, runtimeUtils.noop],
                [StatefulComp.changeBitmask.a, runtimeUtils.assignTextContent(this.context.div1, newState.a)],
                [StatefulComp.changeBitmask.b, runtimeUtils.assignTextContent(this.context.div2, newState.b)],
                [StatefulComp.changeBitmask.changeCount, runtimeUtils.assignTextContent(this.context.div3, `state changed ${newState.changeCount} times`)]
            ]
        ), changeMap);
    }

    public $afterMount(_: HTMLElement) {
        this.context.div1.addEventListener('click', this.onClickA);
        this.context.div2.addEventListener('click', this.onClickB);
    }

    private onClickA = () => runtime.updateState(this as StatefulComp, (s: StatefulCompState) => {
        s.a = s.a + '!';
        return StatefulComp.changeBitmask.a;
    });

    private onClickB = () => runtime.updateState(this as StatefulComp, (s: StatefulCompState) => {
        s.b = s.b + '*';
        return StatefulComp.changeBitmask.b;
    });
}

const initialState = (props: StatefulCompProps) => ({ a: props.initialState, b: props.initialState, changeCount: 0 }) as StatefulCompState;
StatefulComp.factory = {
    unique: Symbol('StatefulCompFactory'),
    initialState,
    toString: (props, state?) => {
        state = state || initialState(props);
        return `<div>
        <div class="btn">
            ${state.a}
        </div>
        <div class="btn">
            ${state.b}
        </div>
        <div>
           state changed ${state.changeCount} times 
        </div>
    </div>`;
    },
    hydrate: (root, props, state) => new StatefulComp(
        {
            root,
            div1: root.children[0] as HTMLDivElement,
            div2: root.children[1] as HTMLDivElement,
            div3: root.children[2] as HTMLDivElement
        }, props, state || initialState(props)
    )
};

export const runExample = (target: HTMLElement) => {
    render(target, StatefulComp as any, { initialState: 'Click me!' });
};