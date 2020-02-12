import { TSXAir, store } from '@tsx-air/framework';

export const WithNothing = TSXAir(() => <div />);

export const WithProps = TSXAir((props: { a: string, b: string, unused: number }) =>
    <div>{props.a}{props.b}</div>);

export const WithState = TSXAir(() => {
    const store1 = store({ a: 1, b: 2 });
    return <div>{store1.a}{store1.b}</div>;
});

export const WithBoth = TSXAir((props: { a: string, b: string, unused: number }) => {
    const store2 = store({ a: props.b, b: 2 });
    return <div>{props.a}{props.b}{store2.a}{store2.b}</div>;
});

export const NestedStateless = TSXAir((pr: { a: string }) => {
    return <div><WithProps a={pr.a} b={pr.a} unused={3}/></div>;
});