import { TSXAir } from '@tsx-air/framework/src';

export const Child = TSXAir((p: { a: string }) => <div>{p.a}</div>);

export const DirectChildComp = TSXAir(() => <Child a="child" />);

export const NestedChildComp = TSXAir(() => <span><Child a="child" /></span>);

export const Var = TSXAir(() => {
    const child = <Child a="var" />;
    return child;
});
