import runtime from '../../framework/new.runtime';
import { TSXAir, createElement } from '../../framework/runtime';

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
    const comp = runtime.render(element, ParentComp, { name });

    const i = setInterval(() => {
        runtime.updateProps(comp, { name: `${name} the ${count++}` });
    }, 50);
    return () => {
        clearInterval(i);
    };
};