import { TSXAir, createElement, render } from '../../framework/runtime';

//// How do we include TSX without this nonsense?
const React = {};

export const ChildComp = TSXAir((props: { name: string }) => <div>Greetings {props.name} from child</div>);
export const ParentComp = TSXAir((props: { name: string }) => (
    <div>
        Hello {props.name} from parent
        <ChildComp name={props.name} />
    </div>
)
);


export const runExample = (element: HTMLElement) => {
    let count = 1;
    const name = 'Sir Gaga';
    const comp = render(element, ParentComp, { name });

    const i = setInterval(() => {
        comp.update({ name: `${name} the ${count++}` });
    }, 50);
    return () => {
        clearInterval(i);
    };
};