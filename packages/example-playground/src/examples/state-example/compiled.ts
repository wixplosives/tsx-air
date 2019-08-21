import { Factory } from './../../framework/types/factory';
import runtime from '../../framework/runtime';
import {  handleDiff, noop, assignTextContent, Diff } from '../../framework/runtime/utils';
import { Stateful } from '../../framework/types/component';


interface StatefulCompCtx { div1: HTMLDivElement; div2: HTMLDivElement; }
interface StatefulCompProps { initialState: string; }
interface StatefulCompState { state: string; state1: string; }

class StatefulComp implements Stateful<StatefulCompCtx, StatefulCompProps, StatefulCompState> {
    public $beforeUpdate = noop;
    public $updateProps = noop;
    public $afterMount = noop;
    public $afterUnmount = noop;
    public $afterUpdate = noop;
    constructor(public readonly context: StatefulCompCtx, public readonly props: StatefulCompProps, public readonly state: StatefulCompState) { 
        context.div1.addEventListener('click', () => {
            runtime.updateState(this, {state: this.state.state + '!'});
        });
        context.div2.addEventListener('click', () => runtime.updateState(this, {state1: this.state.state1 + '*'}));
    }
    public $updateState(diff:Diff<StatefulCompState>) {
        handleDiff(diff, {
            state: assignTextContent(this.context.div1),
            state1: assignTextContent(this.context.div2)
        });
    }
}

export const StatefulCompFactory: Factory<StatefulComp> = {
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
            div1: element.children[0].children[0] as HTMLDivElement,
            div2: element.children[0].children[1] as HTMLDivElement,
        }, props, state
    )
};

export const runExample = (element: HTMLElement) => {
    const initialState = 'Click me';
    runtime.render(element, StatefulCompFactory, { initialState });
};