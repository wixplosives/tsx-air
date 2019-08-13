import { TSXAir, CompiledComponent, hydrate, update } from '../../framework/runtime';

export const ParentComp = TSXAir<CompiledComponent<{ initialState: string }, { state: string, state1: string }>>({
    unique: Symbol('ParentComp'),
    initialState: props => {
        return {
            state: props.initialState,
            state1: props.initialState
        };
    },
    toString: (_props, state) => `<div>
        <div>
            ${state.state}
        </div>
        <div>
            ${state.state1}
        </div>
    </div>`,
    hydrate: (element, instance) => {
        const res = {
            text1: element.children[0].childNodes[0],
            text2: element.children[1].childNodes[0],
        };

        (element.children[0] as HTMLElement).onclick = () => {
            update(ParentComp, element, {}, { state: instance.state.state + '!' });
        };

        (element.children[1] as HTMLElement).onclick = () => {
            update(ParentComp, element, {}, { state1: instance.state.state1 + '*' });
        };
        return res;
    },
    update: (_props, state, instance) => {
        if ('state' in state && state.state !== instance.state.state) {
            instance.context.text1.textContent = state.state;
        }
        if ('state1' in state && state.state1 !== instance.state.state1) {
            instance.context.text2.textContent = state.state1;
        }
    },
    unmount: _instance => {
        //
    }
});


export const runExample = (element: HTMLElement) => {
    const initialState = 'Click me';
    const state = ParentComp.initialState!({ initialState });
    element.innerHTML = ParentComp.toString({ initialState }, state);
    hydrate(ParentComp, element.firstElementChild!, { initialState });
};