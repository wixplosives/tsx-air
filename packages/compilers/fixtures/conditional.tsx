import { TSXAir } from '@tsx-air/framework';
export const Const = TSXAir((props: { a: string }) => {
    const c = props && props.a;
    return <div>{c}</div>;
});


// import { TSXAir } from "@tsx-air/framework";

// export const Const = TSXAir((_p:{}) => {
//     // const innerJsx = <div />;
//     const innerJsx = 'div';
//     return <div>{innerJsx}</div>;
// });

// export const ShallowConditional = TSXAir((p: { count: number }) => <div>{p.count > 0 ? <div>+</div> : <span>-</span>}</div>);
