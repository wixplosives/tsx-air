import { StatefulInstance, StatefulComponentFactory } from './../../framework/framework-types';
import { render, CompiledComponent } from '../../framework/runtime';
import { handlePropsUpdate, handleStateUpdate, noop, assignTextContent } from '../../framework/runtime-helpers';


interface StatefulCompCtx { text1: Text; text2: Text; }
interface StatefulCompProps { initialState: string; }
interface StatefulCompState { state: string; state1: string; }

class StatefulComp implements StatefulInstance<StatefulCompCtx, StatefulCompProps, StatefulCompState> {
    public _beforeUpdate = noop;
    public _updateProps = noop;
    public _afterMount = noop;
    public _afterUnmount = noop;
    public _afterUpdate = noop;
    constructor(public readonly context: StatefulCompCtx, public readonly props: StatefulCompProps, public readonly state: StatefulCompState) { }
    public _updateState(state: Partial<StatefulCompState>) {
        handleStateUpdate(state, this, {
            state: assignTextContent(this.context.text1),
            state1: assignTextContent(this.context.text2)
        });
    }
}

export const StatefulCompFactory: StatefulComponentFactory<StatefulCompCtx, StatefulCompProps, StatefulCompState> = {
    unique: Symbol('StatefulCompFactory'),
    initialState: props => ({ state: props.initialState, state1: props.initialState }),
    toString: (_props, state) => `<div>
        <div>
            ${state.state}
        </div>
        <div>
            ${state.state1}
        </div>
    </div>`,
    hydrate: (element, props, state) => new StatefulComp(
        {
            text1: element.children[0].childNodes[0] as Text,
            text2: element.children[1].childNodes[0] as Text,
        }, props, state
    )
};

export const runExample = (element: HTMLElement) => {
    const initialState = 'Click me';
    render(element, StatefulCompFactory, { initialState });
};