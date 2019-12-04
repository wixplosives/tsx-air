import { TSXAir, store, when } from '../../framework';

export const Derived = TSXAir((props:{a:string}) => {
    // The view is updated iff props.a is changed
    return <div>{'a = ' + props.a}</div>;
});

export const DerivedWithState = TSXAir((props: { a: string }) => {
    const state = store({ count: 0, first: props.a});

    console.log(state.count); // nth iteration: n-1
    when(props.a, () => state.count++);
    console.log(state.count); // nth iteration: n, 

    return <div>{'a = ' + props.a}<div>A was changed {state.count} times</div></div>;
});

export const DerivedWithCalculations = TSXAir((props: { a: string }) => {
    let calculated;  
    if (props.a === '') {
        calculated = '(No input...)';
    } else {
        calculated = `"${props.a}", length: ${props.a.length}`;
    }

    return <div>{calculated}</div>;
});

export const InputValue = TSXAir((_:{})=> {
    const state = store({value:''});
    return <div><input value="" placeholder="Say something"/>{state.value}</div>;
});

export const InputValueWithSpread = TSXAir((_:{})=> {
    const state = store({ value: '', placeholder:'Say something'});
    return <div><input {...state} />{state.value}</div>;
});

export const ShouldNotCompile1 = TSXAir((_props:{})=>{
    const state = store({ count: 0 });
    return <div>{state.count++}</div>;
});

export const ShouldNotCompile2 = TSXAir((_props:{})=>{
    const state = store({ count: 0 });
    return <div>{++state.count}</div>;
});

export const ShouldNotCompile3 = TSXAir((props:{a:number})=>{
    let a = props.a + 1;
    // a can only be modified in the render phase, not on events, timeouts etc
    return <div onClick={() => a++}>{a}</div>;
});

export const ShouldNotCompile4 = TSXAir((_props: {}) => {
    const state = store({ value: '' });
    // although state.value is a store, it is bound to input.value, and therefor can't be set a value
    return <div><input value="" onChange={() => state.value = state.value + '!'} />{state.value}</div>;
});