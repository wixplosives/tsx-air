import { render, TSXAir } from '../../framework';

export const StatefulComp = TSXAir((props: { initialState: string }) => {
    // No hooks, no state declaration. 
    // Instead, state is inferred at compile time.
    let a = props.initialState;
    let b = props.initialState;
    
    const onClickA = () => a = a + '!';
    const onClickB = () => b = b + '*';

    return <div>
        <div onClick={onClickA}>
            ${a}
        </div>
        <div onClick={onClickB}>
            ${b}
        </div>
    </div>;
});

export const runExample = (target: HTMLElement) => {
    const initialState = 'Click me!';
    render(target, StatefulComp, { initialState });
};