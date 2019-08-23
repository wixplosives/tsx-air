import { Context } from './../../framework/types/component';
import { Factory } from '../../framework/types/factory';
import { handleDiff, Diff, assignTextContent } from '../../framework/runtime/utils';
import runtime from '../../framework/runtime';
import { StatelessComponent } from '../../framework/types/component';

interface ParentCompProps { name: string; }
interface ParentCompCtx extends Context {
    text1: ChildNode;
    ChildComp1: ChildComp;
}

export const ParentCompFactory: Factory<ParentComp> = ({
    unique: Symbol('ParentComp'),
    toString: props => `<div class="parent">
      Hello <!-- start props.name -->${props.name}<!-- end props.name --> from parent
      ${ChildCompFactory.toString(props)}
    </div>`,
    hydrate: (root, props) => new ParentComp(
        {
            root,
            text1: root.childNodes[2],
            ChildComp1: ChildCompFactory.hydrate(root.children[0] as HTMLElement, props)
        }, props)
});

class ParentComp extends StatelessComponent<ParentCompCtx, ParentCompProps> {
    public $updateProps(diff: Diff<ParentCompProps>) {
        const {context:{text1, ChildComp1: childComp1}} =this;
        handleDiff(diff, {
            name: value => {
                text1.textContent = value;
                runtime.updateProps(childComp1, {name:value});
            }
        });
    }
}

interface ChildCompProps { name: string; }
interface ChildCompCtx extends Context { text1: Text; }

// tslint:disable-next-line: max-classes-per-file
class ChildComp extends  StatelessComponent<ChildCompCtx, ChildCompProps> {
    public $updateProps(diff: Diff<ChildCompProps>) {
        handleDiff(diff, {
            name: assignTextContent(this.context.text1)
        });
    }
}

export const ChildCompFactory: Factory<ChildComp> = ({
    unique: Symbol('ChildComp'),
    toString: (props: { name: string }) => `<div class="child">Greetings <!-- start props.name -->${props.name}<!-- end props.name --> from child</div>`,
    hydrate: (root, props) => new ChildComp({
        root,
        text1: root.childNodes[2] as Text,
    }, props)
});

export const runExample = (element: HTMLElement) => {
    let count = 1;
    const name = 'Sir Gaga';
    const comp = runtime.render(element, ParentCompFactory, { name })!;

    const i = setInterval(() => {
        runtime.updateProps(comp, { name: `${name} the ${count++}` });
    }, 50);
    return () => {
        clearInterval(i);
    };
};