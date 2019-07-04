import { TSXAir, CompiledComponent, hydrate, ComponentInstance, update } from '../framework/runtime';

/**import { TSXAir } from '../framework/runtime';
import React, { useState } from 'react';
export const ParentComp = TSXAir((props: { initialState: string }) => {
    const [state, setState] = useState(props.initialState);
    return <div onClick={() => setState(state + 'a')}>
        ${state}
    </div>;
}
); */

export const ParentComp = TSXAir<CompiledComponent<{ initialState: string }>>({
    unique: Symbol('ParentComp'),
    initialState: props => {
        return {
            state1: props.initialState
        };
    },
    toString: (props, state) => `<div>
      ${state.state1}
    </div>`,
    hydrate: (element, instance) => {

        const res = {
            text1: element.childNodes[0],
        };

        element.onclick = () => {
            update(ParentComp, element, instance.props, { state1: instance.state.state1 + 'a' });
        };
        return res;
    },
    update: (_props, state, instance) => {
        if (state.state1 !== instance.state.state1) {
            instance.context.text1.textContent = state.state1;
        }
    },
    unmount: instance => {
        //
    }
});


export const runExample = (element: HTMLElement) => {
    const initialState = 'gaga';
    const state = ParentComp.initialState!({ initialState });
    element.innerHTML = ParentComp.toString({ initialState }, state);
    hydrate(ParentComp, element.firstElementChild!, { initialState });
};