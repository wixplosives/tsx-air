import { TSXAir, store } from '@tsx-air/framework/src';

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
        const a=1;        
        if (a===2) {
            console.log(s.a);
        }
        s.a++;
    };
    return <div onClick={onClick} />;
});