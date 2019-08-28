import { render, TSXAir, lifecycle } from '../../framework/runtime/runtime2';

const formater = (str: string, format: string) => str + format;

export const StatefulComp = TSXAir((props: { initialState: string, format: string }) => {

    // No hooks, no state declaration. 
    // Instead, state is inferred at compile time.
    let a = props.initialState;
    // any expression whose reactivity you want to control can be wrapped with memo
    let b = lifecycle.memo(() => props.initialState);
    const c = formater(props.initialState, props.format);
    // in the following line memo is called with no effect as it sets the reactivty to the infered default
    const d = lifecycle.memo(() => props.initialState, [props.initialState]);


    // any variable of this scope that is that is being assigned to inside a different method scope is state
    const onClickA = () => a = a + '!';
    const onClickB = () => b = b + '*';


    // a, c and d will update when initialState updates
    // b will not update when initialState updates

    return <div>
        <div onClick={onClickA}>
            {a}
        </div>
        <div onClick={onClickB}>
            {b}
        </div>
        <span>{c}</span>
        <span>{d}</span>
    </div>;
});

export const runExample = (element: HTMLElement) => {
    const values = ['click me', 'kill homer'];
    let current = 0;
    const comp = render(element, StatefulComp, { initialState: values[0], format: 'gaga' })!;
    const i = setInterval(() => {
        if (Math.random() > 0.99) {
            current = current === 0 ? 1 : 0;
        }
        comp.update({ initialState: values[current], format: 'gaga' });
    }, 50);
    return () => {
        clearInterval(i);
    };
};