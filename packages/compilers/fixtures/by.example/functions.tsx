import { store, TSXAir } from '@tsx-air/framework';

export const NamedFunction = TSXAir(() => {
    const store1 = store({ a: 'initial' });
    const vol = `volatile`;
    const getDisplayedStr = (b:string) => `${store1.a} ${vol} ${b}`;
    return <div>{getDisplayedStr('param')}</div>;
});
