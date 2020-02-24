import { Component, Factory, runtime, runtimeUtils } from '@tsx-air/framework';

// Inferred from the TSX all possible return values 
interface StatefulCompCtx { root: HTMLElement; div1: HTMLDivElement; div2: HTMLDivElement; div3: HTMLDivElement; }

interface StatefulCompProps { initialState: string; }
// All the component scope vars [possibly only those who are bound to the view]
interface StatefulCompState {
    state: { a: string; b: string; changeCount: number; };
}

export class StatefulComp extends Component<StatefulCompCtx, StatefulCompProps, StatefulCompState> {
    public static factory: Factory<StatefulComp>;
    public static readonly changeBitmask: Record<string, number> = {
        'props.initialState': 1 << 0,
        'state.a': 1 << 1,
        'state.b': 1 << 2,
        'state.changeCount': 1 << 3
    };

    public $$processUpdate(_: StatefulCompProps, { state }: StatefulCompState, changeMap: number): void {
        if (changeMap !== StatefulComp.changeBitmask['state.changeCount']) {
            // tslint:disable-next-line: no-shadowed-variable
            runtime.updateState(this as StatefulComp, ({ state }: StatefulCompState) => {
                state.changeCount++;
                return StatefulComp.changeBitmask['state.changeCount'];
            });
        }

        runtimeUtils.handleChanges(StatefulComp.changeBitmask, new Map<string, () => void>(
            [
                ['props.initialState', runtimeUtils.noop],
                ['state.a', runtimeUtils.assignTextContent(this.context.div1, state.a)],
                ['state.b', runtimeUtils.assignTextContent(this.context.div2, state.b)],
                ['state.changeCount', runtimeUtils.assignTextContent(this.context.div3, '' + state.changeCount)]
            ]
        ), changeMap);
    }

    public $afterMount(_: HTMLElement) {
        this.context.div1.addEventListener('click', this.onClickA);
        this.context.div2.addEventListener('click', this.onClickB);
    }

    private onClickA = () => runtime.updateState(this as StatefulComp, ({ state }: StatefulCompState) => {
        state.a = state.a + '!';
        return StatefulComp.changeBitmask['state.a'];
    });

    private onClickB = () => runtime.updateState(this as StatefulComp, ({ state }: StatefulCompState) => {
        state.b = state.b + '*';
        return StatefulComp.changeBitmask['state.b'];
    });
}

const initialState = (props: StatefulCompProps) =>
    ({
        state: {
            a: props.initialState+'A',
            b: props.initialState+'B',
            changeCount: 0
        }
    }) as StatefulCompState;

StatefulComp.factory = {
    unique: Symbol('StatefulCompFactory'),
    initialState,
    toString: (props, s?) => {
        const {state} = s || initialState(props);
        return `<div>
        <div class="btn">
            ${state.a}
        </div>
        <div class="btn">
            ${state.b}
        </div>
        <div>
           state changed <!-- state.changeCount -->${state.changeCount}<!-- --> times 
        </div>
        <div>
           volatile variable is still at <!-- state.changeCount -->${1}<!-- -->
        </div>
    </div>`;
    },
    hydrate: (root, props, state) => new StatefulComp(
        {
            root,
            div1: root.children[0] as HTMLDivElement,
            div2: root.children[1] as HTMLDivElement,
            // @ts-ignore
            div3: root.children[2].childNodes[2] as Text,
            // @ts-ignore
            div4: root.children[3].childNodes[2] as Text,
        }, props, state || initialState(props)
    )
};