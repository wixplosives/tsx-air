import { render, TSXAir, lifecycle } from '../../framework';

export const StatefulComp = TSXAir((props: { initialState: string }) => {

    // No hooks, no state declaration. 
    // Instead, state is inferred at compile time.
    let a = props.initialState;
    // any expression you do not want to be treated as reactive can be wrapped with once
    let b = lifecycle.once(() => props.initialState);
    const c = props.initialState;
    const d = lifecycle.once(() => props.initialState);


    // any variable of this scope that is that is being assigned to inside a different method scope is state
    const onClickA = () => a = a + '!';
    const onClickB = () => b = b + '*';


    // a and c will update when initialState updates
    // b and d will not update when initialState updates
    // a and b are both state because they are reassigned d is state only because it is set once.

    return <div>
        <div onClick={onClickA}>
            ${a}
        </div>
        <div onClick={onClickB}>
            ${b}
        </div>
        <span>{c}</span>
        <span>{d}</span>
    </div>;
});

export const runExample = (element: HTMLElement) => {
    const values = ['click me', 'kill homer'];
    let current = 0;
    const comp = render(element, StatefulComp ,  { initialState: values[0] })!;
    const i = setInterval(() => {
        if (Math.random() > 0.99) {
            current = current === 0 ? 1 : 0;
        }
        comp.updateProps({ initialState: values[current] });
    }, 50);
    return () => {
        clearInterval(i);
    };
};