import { TSXAir, store } from '@tsx-air/framework';

export const Static = TSXAir(() => <div />);

export const PropsOnly = TSXAir((props: { a: string, b: string, unused: number }) =>
    <div>{props.a}{props.b}</div>);

export const StateOnly = TSXAir(() => {
    const store1 = store({ a: 1, b: 2 });
    return <div>{store1.a}{store1.b}</div>;
});

export const ProsAndState = TSXAir((props: { a: string, b: string, unused: number }) => {
    const store2 = store({ a: props.b, b: 2 });
    return <div>{props.a}{props.b}{store2.a}{store2.b}</div>;
});

export const NestedStateless = TSXAir((pr: { a: string }) => {
    return <div><PropsOnly a={pr.a} b={pr.a} unused={3} /></div>;
});

export const EventListener = TSXAir(() => {
    const onclick = () => void 0;
    return <div onClick={onclick} />;
});

export const StaticAttributes = TSXAir(() =>
    <div className="cls" dir="ltr"><a href="#" /></div>);

export const DynamicAttributes = TSXAir((props: { a: string }) =>
    <div dir={'ltr'} lang={props.a}><span /></div>);

export const DynamicAttributesSelfClosing = TSXAir((props: { a: string }) =>
    <div dir={'ltr'} lang={props.a} />);

export const WithVolatile = TSXAir((props: { a: number }) => {
    let b = props.a;
    b++;
    const c = `${b}`;
    const d = 'D: ' + c;
    return <div>{d}</div>;
});

