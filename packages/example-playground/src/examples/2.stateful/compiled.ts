import { Factory } from '../../framework/types/factory';
import runtime from '../../framework/runtime';
import { handleDiff, assignTextContent, Diff } from '../../framework/runtime/utils';
import { StatefulComponent, Context } from '../../framework/types/component';


// Inferred from the TSX all possible return values 
interface StatefulCompCtx extends Context { div1: HTMLDivElement; div2: HTMLDivElement; }

interface StatefulCompProps { initialState: string; }
// All the component scope vars [possibly only those who are bound to the view]
interface StatefulCompState { a: string; b: string; }

class StatefulComp extends StatefulComponent<StatefulCompCtx, StatefulCompProps, StatefulCompState> {
    public $updateProps(_diff: any): void {
        /* Noop */
    }

    public $afterMount(_:HTMLElement){
        this.context.div1.addEventListener('click', this.onClickA);
        this.context.div2.addEventListener('click', this.onClickB);
    }

    public $updateState(diff: Diff<StatefulCompState>, _delta:Partial<StatefulCompState>) {
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
    hydrate: (root, props, state) => new StatefulComp(
        {
            root,
            div1: root.children[0] as HTMLDivElement,
            div2: root.children[1] as HTMLDivElement,
        }, props, state || initialState(props)
    )
};

export const runExample = (element: HTMLElement) => {
    runtime.render(element, StatefulCompFactory, { initialState: 'Click me' });
};