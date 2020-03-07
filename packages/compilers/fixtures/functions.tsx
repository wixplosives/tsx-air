import { TSXAir, store } from '@tsx-air/framework';

export const WithStateChangeOnly = TSXAir(() => {
    const s = store({ a: 1 });
    const onClick = () => {
        s.a = 1;
        s.a = s.a + 1;
        s.a++;
    };
    s.a = 3;
    return <div onClick={onClick} />;
});

export const WithNonStateChangingCode = TSXAir(() => {
    const s = store({ a: 1 });
    const onClick = () => {
        const a = 1;
        if (a === 2) {
            console.log(s.a);
        }
    };
    return <div onClick={onClick} />;
});

export const WithVolatileVars = TSXAir((props: { p: number }) => {
    const a = props.p;
    let b = a + 1;
    b++;
    return <div>{b}</div>;
});

export const WithVolatileAndStateChange = TSXAir((props: { p: number }) => {
    const s = store({ a: props.p });
    let b = s.a + 1;
    b++;
    s.a = s.a + b;
    const someFunc = (c:string) => s.a + b + c;
    const unused = () => s.a;
    return <div>{someFunc('const')}</div>;
});

export const InvalidFunctionUse = TSXAir(() => {
    const store1 = store({ a: 'initial' });
    const getDisplayedStr = () => {
        store1.a = 'Invalid in return statement';
        return `${store1.a} volatile`;
    };
    return <div>{getDisplayedStr()}</div>;
});