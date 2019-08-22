import { Factory } from './../../framework/types/factory';
import runtime from '../../framework/runtime';
import { handleDiff, noop, assignTextContent, Diff } from '../../framework/runtime/utils';
import { Stateful } from '../../framework/types/component';


// Inferred from the TSX all possible return values 
interface StatefulCompCtx { root: HTMLDivElement; div1: HTMLDivElement; div2: HTMLDivElement; }

interface StatefulCompProps { initialState: string; }
// All the component scope vars [possibly only those who are bound to the view]
interface StatefulCompState { a: string; b: string; }

class StatefulComp implements Stateful<StatefulCompCtx, StatefulCompProps, StatefulCompState> {
    public $beforeUpdate = noop;
    public $updateProps = noop;
    public $afterMount = noop;
    public $afterUnmount = noop;
    public $afterUpdate = noop;

    constructor(public readonly context: StatefulCompCtx, public readonly props: StatefulCompProps, public readonly state: StatefulCompState) {
        context.div1.addEventListener('click', this.onClickA);
        context.div2.addEventListener('click', this.onClickB);
    }
    public $updateState(diff: Diff<StatefulCompState>) {
        handleDiff(diff, {
            a: assignTextContent(this.context.div1),
            b: assignTextContent(this.context.div2)
        });
    }

    // shallow consts can be mapped to a private members
    private onClickA = () => runtime.updateState(this, { a: this.state.a + '!' });
    private onClickB = () => runtime.updateState(this, { b: this.state.b + '*' });
}


const initialState = (props: StatefulCompProps) => ({ a: props.initialState, b: props.initialState }) as StatefulCompState;
export const StatefulCompFactory: Factory<StatefulComp> = {
    unique: Symbol('StatefulCompFactory'),
    initialState,
    toString: (props, state) => {
        state = state || initialState(props);
        return `<div>
        <div>
            ${state.a}
        </div>
        <div>
            ${state.b}
        </div>
    </div>`;
    },
    hydrate: (element, props, state) => new StatefulComp(
        {
            root: element as HTMLDivElement,
            div1: element.children[0] as HTMLDivElement,
            div2: element.children[1] as HTMLDivElement,
        }, props, state || initialState(props)
    )
};

export const runExample = (element: HTMLElement) => {
    runtime.render(element, StatefulCompFactory, { initialState: 'Click me' });
};