import { TSXAir, store } from '@tsx-air/framework';

export const PreDefinedHandler = TSXAir(() => {
    const state = store({ count: 0 });
    const handler = (_event:any) => state.count++;
    return <div onClick={handler}>{state.count}</div>;
});

export const LambdaHandler = TSXAir(() => {
    const state = store({ count: 0 });
    return <div onClick={() => state.count++}>{state.count}</div>;
});
