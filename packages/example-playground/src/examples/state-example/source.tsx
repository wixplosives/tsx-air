import { TSXAir, render, createElement } from '../../framework/runtime';
import { useState } from 'react';
export const ParentComp = TSXAir((props: { initialState: string }) => {
    const [state, setState] = useState(props.initialState);
    const [state1, setState1] = useState(props.initialState);
    
    const onClick = () => setState(state + 'a');
    const onClick1 = () => setState1(state1 + 'a');

    return <div>
        <div onClick={onClick}>
            ${state}
        </div>
        <div onClick={onClick1}>
            ${state1}
        </div>
    </div>;

});

export const runExample = (element: HTMLElement) => {
    const initialState = 'gaga';
    render(element, ParentComp, { initialState });
};