import { TSXAir, createElement, render } from '../../framework/runtime';

export const ChildComp = TSXAir((props: { name: string }) => <div>hello {props.name} </div>);

export const ParentComp = TSXAir((props: { name: string }) => (
    <div>
        hello {props.name}xxx
        <ChildComp name={props.name} />
    </div>
)
);


export const runExample = (element: HTMLElement) => {
    let name = 'gaga';
    const comp = render(element, ParentComp, { name });

    const i = setInterval(() => {
        name += 'gaga';
        comp.update({ name });
    }, 50);
    return () => {
        clearInterval(i);
    };
};