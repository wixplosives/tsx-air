import { TSXAir } from '@tsx-air/framework';

export const DeepComponent = TSXAir((props: { a: string }) =>
    <div about={props.a}>{props.a}
        <span>
            <div>{props.a}</div>
        </span>
        <div lang={props.a} />
    </div>
);
