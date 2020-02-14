import { TSXAir } from '@tsx-air/framework';

export const DeepComponent = TSXAir((props: { a: string }) =>
    <div about={props.a}>
        <span>
            <div>{props.a}</div>
        </span>
        <div about={props.a} />
    </div>
);
