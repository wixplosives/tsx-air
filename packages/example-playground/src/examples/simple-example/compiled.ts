import { StatelessComponentFactory, StatelessInstance } from './../../framework/framework-types';
import { handlePropsUpdate, noop } from '../../framework/runtime-helpers';
import runtime from '../../framework/new.runtime';

interface ParentCompProps { name: string; }
interface ParentCompCtx {
    text1: ChildNode;
    ChildComp1: ChildComp;
}

export const ParentCompFactory: StatelessComponentFactory<ParentCompCtx, ParentCompProps> = ({
    unique: Symbol('ParentComp'),
    toString: props => `<div>
      Hello <!-- start props.name -->${props.name}<!-- end props.name --> from parent
      ${runtime}
    </div>`,
    hydrate: (element, props) => new ParentComp(
        props,
        {
            text1: element.childNodes[2],
            ChildComp1: ChildCompFactory.hydrate(element.children[0] as HTMLElement, { name: props.name }) as ChildComp
        })
});

class ParentComp implements StatelessInstance<ParentCompCtx, ParentCompProps> {
    public _beforeUpdate = noop;
    public _afterMount = noop;
    public _afterUpdate = noop;

    constructor(public readonly props: ParentCompProps, public readonly context: ParentCompCtx) { }
    public _updateProps(props: ParentCompProps) {
        handlePropsUpdate(props, this, {
            name: value => this.context.text1.textContent = value
        });
    }

    public _afterUnmount() {
        this.context.ChildComp1._afterUnmount();
    }

}

interface ChildCompProps { name: string; }
interface ChildCompCtx { text1: Text; }

// tslint:disable-next-line: max-classes-per-file
class ChildComp implements StatelessInstance<ChildCompCtx, ChildCompProps> {
    public _beforeUpdate = noop;
    public _afterMount = noop;
    public _afterUnmount = noop;
    public _afterUpdate = noop;

    constructor(public readonly props: ChildCompProps, public readonly context: ChildCompCtx) { }
    public _updateProps(props: ChildCompProps) {
        handlePropsUpdate(props, this, {
            name: value => this.context.text1.textContent = value
        });
    }
}

export const ChildCompFactory: StatelessComponentFactory<ChildCompCtx, ChildCompProps> = ({
    unique: Symbol('ChildComp'),
    toString: (props: { name: string }) => `<div>Greetings <!-- start props.name -->${props.name}<!-- end props.name --> from child</div>`,
    hydrate: (target, props) => new ChildComp(props, {
        text1: target.childNodes[2] as Text,
    })
});

export const runExample = (element: HTMLElement) => {
    let count = 1;
    const name = 'Sir Gaga';
    const comp = runtime.render(element, ParentCompFactory, { name });

    const i = setInterval(() => {
        runtime.updateProps(comp, { name: `${name} the ${count++}` });
    }, 50);
    return () => {
        clearInterval(i);
    };
};