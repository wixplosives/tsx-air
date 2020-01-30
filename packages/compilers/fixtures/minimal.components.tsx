import { TSXAir, store } from '@tsx-air/framework';

export const withNothing = TSXAir(() => <div />);
export const withProps = TSXAir((props: { a: string, b: string, unused: number }) =>
    <div>{props.a}{props.b}</div>);
export const withState = TSXAir(() => {
    const store1 = store({ a: 1, b: 2 });
    return <div>{store1.a}{store1.b}</div>;
});
export const withBoth = TSXAir((props: { a: string, b: string, unused: number }) => {
    const store2 = store({ a: props.b, b: 2 });
    return <div>{props.a}{props.b}{store2.a}{store2.b}</div>;
});
