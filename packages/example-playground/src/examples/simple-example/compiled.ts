import { Factory } from '../../framework/types/factory';
import { noop, handleDiff, Diff, assignTextContent } from '../../framework/runtime/utils';
import runtime from '../../framework/runtime';
import { Stateless } from '../../framework/types/component';

interface ParentCompProps { name: string; }
interface ParentCompCtx {
    text1: ChildNode;
    ChildComp1: ChildComp;
}

export const ParentCompFactory: Factory<ParentComp> = ({
    unique: Symbol('ParentComp'),
    toString: props => `<div>
      Hello <!-- start props.name -->${props.name}<!-- end props.name --> from parent
      ${ChildCompFactory.toString(props)}
    </div>`,
    hydrate: (element, props) => new ParentComp(
        props,
        {
            text1: element.children[0].childNodes[2],
            ChildComp1: ChildCompFactory.hydrate(element.children[0].children[0] as HTMLElement, props)
        })
});

class ParentComp implements Stateless<ParentCompCtx, ParentCompProps> {
    public $beforeUpdate = noop;
    public $afterMount = noop;
    public $afterUpdate = noop;

    constructor(public readonly props: ParentCompProps, public readonly context: ParentCompCtx) { }
    public $updateProps(diff: Diff<ParentCompProps>) {
        const {context:{text1, ChildComp1: childComp1}} =this;
        handleDiff(diff, {
            name: value => {
                text1.textContent = value;
                runtime.updateProps(childComp1, {name:value});
            }
        });
    }

    public $afterUnmount() {
        // possibly should be done by runtime
        this.context.ChildComp1.$afterUnmount();
    }

}

interface ChildCompProps { name: string; }
interface ChildCompCtx { text1: Text; }

// tslint:disable-next-line: max-classes-per-file
class ChildComp implements Stateless<ChildCompCtx, ChildCompProps> {
    public $beforeUpdate = noop;
    public $afterMount = noop;
    public $afterUnmount = noop;
    public $afterUpdate = noop;

    constructor(public readonly props: ChildCompProps, public readonly context: ChildCompCtx) { }
    public $updateProps(diff: Diff<ChildCompProps>) {
        handleDiff(diff, {
            name: assignTextContent(this.context.text1)
        });
    }
}

export const ChildCompFactory: Factory<ChildComp> = ({
    unique: Symbol('ChildComp'),
    toString: (props: { name: string }) => `<div>Greetings <!-- start props.name -->${props.name}<!-- end props.name --> from child</div>`,
    hydrate: (target, props) => new ChildComp(props, {
        text1: target.childNodes[2] as Text,
    })
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