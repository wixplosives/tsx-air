import { TSXAir } from '@tsx-air/framework';

export const Child = TSXAir((props: { b: string }) =>
    <div>{props.b}</div>);

export const Parent = TSXAir((props: { a: string }) =>
    <div><Child b={props.a} /></div>);
