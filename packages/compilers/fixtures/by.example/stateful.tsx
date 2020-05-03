import { TSXAir, store } from '@tsx-air/framework';
export const Comp = TSXAir(() => {
    const store1 = store({ a: 'initial' });
    return <div>{store1.a}</div>;
});

export const WithVolatile = TSXAir(() => {
    const store1 = store({ a: 'initial' });
    const vol = `volatile`;
    return <div>{store1.a} {vol}</div>;
});
