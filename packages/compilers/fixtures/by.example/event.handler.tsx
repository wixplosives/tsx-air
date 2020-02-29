import { TSXAir, store } from '@tsx-air/framework';
export const PreDefinedHandler = TSXAir(() => {
    const state = store({ count: 0 });
    const handler = () => state.count++;
    return <div onClick={handler}>{state.count}</div>;
});
