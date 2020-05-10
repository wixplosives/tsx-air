import { TSXAir } from "@tsx-air/framework";

export const Const = TSXAir((_p:{}) => {
    const innerJsx = <div />;
    return <div>{innerJsx}</div>;
});

export const ShallowConditional = TSXAir((p: { count: number }) => <div>{p.count > 0 ? <div>+</div> : <span>-</span>}</div>);
