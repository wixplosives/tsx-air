import { TSXAir, create, CompiledComponent } from '../../framework/runtime';
//// How do we include TSX without this nonsense?
const React = {};
export const ChildComp = TSXAir((props: { name: string }) => <div>hello {props.name} from child</div>);
export const ParentComp = TSXAir((props: { name: string }) => (
    <div>
        Hello {props.name} from parent
        <ChildComp name={props.name} />
    </div>
));

export const runExample = (element:HTMLElement) => {
    const parent = create(ParentComp as unknown as CompiledComponent<{ name: string }>, { name:'Initial name'});
    element.appendChild(parent);

    const i = setInterval(() => {
        const name = `Sir Gaga the ${count++}`;
        ParentComp.update({ name }, {}, instance);
    }, 50);
    return () => {
        clearInterval(i);
    };
};