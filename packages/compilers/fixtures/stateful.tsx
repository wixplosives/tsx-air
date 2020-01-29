import { TSXAir, store } from '@tsx-air/framework';
export const comp = TSXAir(() => {
    const state1 = store({ a: 'initial' });
    return <div>{state1.a}</div>;
});
