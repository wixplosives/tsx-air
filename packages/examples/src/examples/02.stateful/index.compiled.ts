import { Component, Factory, runtime } from '@tsx-air/framework';

// Inferred from the TSX all possible return values
interface StatefulCompCtx {
    root: HTMLElement;
    elm0: HTMLDivElement;
    exp1: Text;
    elm2: HTMLDivElement;
    exp3: Text;
    exp4: Text;
}

interface StatefulCompProps {
    initialState: string;
}
// All the component scope vars [possibly only those who are bound to the view]
interface StatefulCompState {
    state: { a: string; b: string; aCounter: number, bCounter: number, changeCount: number };
}

export class StatefulComp extends Component<StatefulCompCtx, StatefulCompProps, StatefulCompState> {
    public static factory: Factory<StatefulComp>;
    public static readonly changeBitmask: Record<string, number> = {
        'props.initialState': 1 << 0,
        'state.a': 1 << 1,
        'state.b': 1 << 2,
        'state.changeCount': 1 << 3,
        'state.aCounter': 1 << 4,
        'state.bCounter': 1 << 5,
    };
    public onClickA!: () => any;
    public onClickB!: () => any;

    constructor(readonly ctx: StatefulCompCtx, readonly props: StatefulCompProps, readonly state: StatefulCompState) {
        super(ctx, props, state);
        this.onClickA = () => runtime.execute(this, this._onClickA);
        this.onClickB = () => runtime.execute(this, this._onClickB);
    }

    public preRender(_props: StatefulCompProps, _state: StatefulCompState) {
        let volatile = 0;
        volatile++;
        runtime.updateState(
            this as StatefulComp, _state, ({ state }) => {
                state.changeCount += volatile;
                return StatefulComp.changeBitmask['state.changeCount'];
            });
        return { volatile };
    }

    public updateView(_: StatefulCompProps, { state }: StatefulCompState, _volatile: any, changeMap: number): void {
        if (changeMap & StatefulComp.changeBitmask['state.a']) {
            this.context.exp1.textContent = state.a;
        }
        if (changeMap & StatefulComp.changeBitmask['state.b']) {
            this.context.exp3.textContent = state.b;
        }
        if (changeMap & StatefulComp.changeBitmask['state.changeCount']) {
            this.context.exp4.textContent = `${state.changeCount}`;
        }
    }

    public $afterMount(_: HTMLElement) {
        this.context.elm0.addEventListener('click', this.onClickA);
        this.context.elm2.addEventListener('click', this.onClickB);
    }

    private _onClickA = (props: StatefulCompProps, s: StatefulCompState, _volatile: any) =>
        runtime.updateState(this as StatefulComp, s, ({ state }: StatefulCompState) => {
            state.a = `${props.initialState} A (${++state.aCounter})`;
            return StatefulComp.changeBitmask['state.a'] | StatefulComp.changeBitmask['state.aCounter'];
        });

    private _onClickB = (props: StatefulCompProps, s: StatefulCompState, _volatile: any) =>
        runtime.updateState(this as StatefulComp, s, ({ state }: StatefulCompState) => {
            state.b = `${props.initialState} B (${++state.bCounter})`;
            return StatefulComp.changeBitmask['state.b'] | StatefulComp.changeBitmask['state.bCounter'];
        });
}

const initialState = (props: StatefulCompProps) =>
    ({
        state: {
            a: props.initialState + 'A',
            b: props.initialState + 'B',
            aCounter: 0,
            bCounter: 0,
            changeCount: 0
        }
    } as StatefulCompState);

StatefulComp.factory = {
    unique: Symbol('StatefulCompFactory'),
    initialState,
    toString: (props, s?) => {
        const { volatile } = runtime.toStringPreRender(StatefulComp, props, s);
        const { state } = s || initialState(props);
        return `<div>
        <div class="btn">
            <!-- -->${state.a}<!-- -->
        </div>
        <div class="btn">
            <!-- -->${state.b}<!-- -->
        </div>
        <div>
           state changed <!-- state.changeCount -->${state.changeCount}<!-- --> times 
        </div>
        <div>
           volatile variable is still at <!-- state.changeCount -->${volatile}<!-- -->
        </div>
    </div>`;
    },
    hydrate: (root, props, state) =>
        new StatefulComp(
            {
                root,
                elm0: root.children[0] as HTMLDivElement,
                exp1: root.children[0].childNodes[2] as Text,
                elm2: root.children[1] as HTMLDivElement,
                exp3: root.children[1].childNodes[2] as Text,
                exp4: root.children[2].childNodes[2] as Text,
            },
            props,
            state || initialState(props)
        )
};
