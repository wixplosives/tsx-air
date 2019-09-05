import { render, TSXAir, initState, lifecycle, when } from '../../framework';

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

export const StatefulComp2 = TSXAir((props: { initialState: string }) => {
    // with state declaration. 
    const state = initState({ a: props.initialState, b: props.initialState });

    const onClickA = () => state.a = state.a + '!';
    const onClickB = () => state.b = state.b + '*';

    return <div>
        <div onClick={onClickA}>
            ${state.a}
        </div>
        <div onClick={onClickB}>
            ${state.b}
        </div>
    </div>;
});


/** problem case 1
 * parameter assignmet based on 0 parameters
 */

export const StatefulComp3 = TSXAir((props: { initialState: string }) => {
    // with state declaration. 
    const state = initState({ a: props.initialState, b: props.initialState, counter: 0 });

    const onClickA = () => state.a = state.a + '!';
    const onClickB = () => state.b = state.b + '*';
    state.a += '|';
    state.b += '|';
    return <div>
        <div onClick={onClickA}>
            ${state.a}
        </div>
        <div onClick={onClickB}>
            ${state.b}
        </div>
    </div>;
});

/**
 * should a and b both be changed when onClickA is called?
 */

/** problem case 1 variation
 * parameter assignmet based on 1 parameters
 */

export const StatefulComp4 = TSXAir((props: { initialState: string, anotherProp: string }) => {
    // with state declaration. 
    const state = initState({ a: props.initialState, b: props.initialState, counter: 0 });

    const onClickA = () => state.a = state.a + '!';
    const onClickB = () => state.b = state.b + '*';
    state.a += props.anotherProp;
    state.b += props.anotherProp;
    return <div>
        <div onClick={onClickA}>
            ${state.a}
        </div>
        <div onClick={onClickB}>
            ${state.b}
        </div>
    </div>;
});
/**
 * should a and b be changed when onClickA is called?
 */

/** problem case 1 variation 2
 * parameter assignmet based on 1 parameters
 */

export const StatefulComp5 = TSXAir((props: { initialState: string, anotherProp: string }) => {
    // with state declaration. 
    const state = initState({ a: props.initialState, b: props.initialState, counter: 0 });

    const onClickA = () => state.a = state.a + '!';
    const onClickB = () => state.b = state.b + '*';
    state.counter++;
    return <div>
        <div onClick={onClickA}>
            ${state.a}
        </div>
        <div onClick={onClickB}>
            ${state.b}
        </div>
    </div>;
});
/**
 * should the counter be updated everytime any state and prop and changed, or never?
 */



/**
 * I'm starting to think that changing the state in the render function is not something we're gonna allow
 * making this more verbose syntax preferable in some ways 
 */

export const StatefulCompVerbose = TSXAir((props: { initialState: string, anotherProp: string }) => {
    // with state declaration. 
    const state = initState({ a: props.initialState, b: props.initialState, counter: 0 });

    const onClickA = () => state.a = state.a + '!';
    const onClickB = () => state.b = state.b + '*';
    when([state.a, state.a], () => state.counter++);

    return <div>
        <div onClick={onClickA}>
            ${state.a}
        </div>
        <div onClick={onClickB}>
            ${state.b}
        </div>
    </div>;
});

/** 
 * in this case its to me clear that when state.a  or state.b change state.counter shoule be added to
 * and when state.counter changes 
 */

export const runExample = (target: HTMLElement) => {
    render(target, StatefulComp, { initialState: 'Click me!' });
};