import { TSXAir, store } from '@tsx-air/framework';

export const Parent = TSXAir((props: { a: number }) => {
    const state = store({ counter: 0 });
    state.counter++;
    if (props.a < 0) {
        return <span>
            <Child ca={props.a} cb={-props.a} />
            {props.a}
        </span>;
    }
    if (props.a < 5) {
        return <Parent a={props.a + 1} />;
    }
    return <Child ca={props.a} cb={state.counter} />;
});

export const Child = TSXAir((props: { ca: number, cb: number }) => 
    <div>{props.ca} {props.cb}</div>);

