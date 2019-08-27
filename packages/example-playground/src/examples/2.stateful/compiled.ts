import { Factory } from '../../framework/types/factory';
import runtime from '../../framework/runtime';
import { handleDiff, assignTextContent, Diff } from '../../framework/runtime/utils';
import { StatefulComponent, Context } from '../../framework/types/component';


// Inferred from the TSX all possible return values 
interface StatefulCompCtx extends Context { div1: HTMLDivElement; div2: HTMLDivElement; span1: HTMLDivElement; span2: HTMLDivElement; }

interface StatefulCompProps { initialState: string; }
// All the component scope vars [possibly only those who are bound to the view]
interface StatefulCompState { a: string; b: string; c: string; d: string; }

class StatefulComp extends StatefulComponent<StatefulCompCtx, StatefulCompProps, StatefulCompState> {
    public $updateProps(diff: any): void {
        handleDiff<StatefulCompProps>(diff, {
            initialState: val => {
                runtime.updateState(this, { a: val, c: val });
            }
        });
    }

    public $afterMount(_: HTMLElement) {
        this.context.div1.addEventListener('click', this.onClickA);
        this.context.div2.addEventListener('click', this.onClickB);
    }

    public $updateState(diff: Diff<StatefulCompState>, _delta: Partial<StatefulCompState>) {
        handleDiff<StatefulCompState>(diff, {
            a: assignTextContent(this.context.div1),
            b: assignTextContent(this.context.div2),
            c: assignTextContent(this.context.span1),
            d: assignTextContent(this.context.span2)
        });
    }

    // shallow consts can be mapped to a private members
    private onClickA = () => runtime.updateState(this, { a: this.state.a + '!' });
    private onClickB = () => runtime.updateState(this, { b: this.state.b + '*' });
}


const initialState = (props: StatefulCompProps) => ({ a: props.initialState, b: props.initialState, c: props.initialState, d: props.initialState }) as StatefulCompState;
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
        <span>${state.c}</span>
        <span>${state.d}</span>
    </div>`;
    },
    hydrate: (root, props, state) => new StatefulComp(
        {
            root,
            div1: root.children[0] as HTMLDivElement,
            div2: root.children[1] as HTMLDivElement,
            span1: root.children[3] as HTMLDivElement,
            span2: root.children[4] as HTMLDivElement,
        }, props, state || initialState(props)
    )
};

export const runExample = (element: HTMLElement) => {
    const values = ['click me', 'kill homer'];
    let current = 0;
    const comp = runtime.render(element, StatefulCompFactory, { initialState: values[0] })!;
    const i = setInterval(() => {
        if (Math.random() > 0.99) {
            current = current === 0 ? 1 : 0;
        }
        runtime.updateProps(comp, { initialState: values[current] });
    }, 50);
    return () => {
        clearInterval(i);
    };
};