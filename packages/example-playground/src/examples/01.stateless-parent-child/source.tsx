// No need to import anything you're not going to use
import { TSXAir, render } from '../../framework';

// Components are TSX functions wrapped by TSXAir
export const ChildComp = TSXAir((props: { name: string }) => <div>Greetings {props.name} from child</div>);
export const ParentComp = TSXAir((props: { name: string }) => (
    <div>
        Hello {props.name} from parent
        <ChildComp name={props.name} />
    </div>
));

export const runExample = (element: HTMLElement) => {
    let count = 1;
    const name = 'Sir Gaga';
    const app = render(element, ParentComp, { name });

    const i = setInterval(() => {
        app.updateProps({ name: `${name} the ${count++}` });
    }, 50);
    return () => {
        clearInterval(i);
    };
};