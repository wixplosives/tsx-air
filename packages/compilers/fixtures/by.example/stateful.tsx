import { TSXAir, store } from '@tsx-air/framework';
export const Comp = TSXAir(() => {
    const store1 = store({ a: 'initial' });
    return <div>{store1.a}</div>;
});