import { TSXAir, createElement } from '../../framework/runtime';
import runtime from '../../framework/new.runtime';

export const StatefulComp = TSXAir((props: { initialState: string }) => {
    let state = props.initialState;
    let state1 = props.initialState;

    const onClick = () => state = state + '!';
    const onClick1 = () => state1 = state1 + '!';

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
    const initialState = 'Click me!';
    runtime.render(element, StatefulComp, { initialState });
};