import { render, TSXAir, bind } from '../../framework';

export const StatefulComp = TSXAir((props: { initialState: string }) => {
    // No hooks, no state declaration. 
    // Instead, state is inferred at compile time.
    let a = bind.init(props.initialState);
    let b = bind.init(props.initialState);
    let changeCount = bind.init(0);

    const onClickA = () => a = a + '!';
    const onClickB = () => b = b + '*';

    return <div>
        <div onClick={onClickA}>
            {a}
        </div>
        <div onClick={onClickB}>
            {b}
        </div>
        <div>state changed {changeCount++} times</div>
    </div>;
});

export const runExample = (target: HTMLElement) => {
    render(target, StatefulComp, { initialState: 'Click me!' });
};