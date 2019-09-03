import { Dom } from '../../framework/types/component';
import { Factory } from '../../framework/types/factory';
import runtime from '../../framework/runtime';
import { Component } from '../../framework/types/component';

/* tslint:disable:rule no-bitwise */

interface ParentCompProps { name: string; }
interface ParentCompCtx extends Dom {
    text1: ChildNode;
    childComp1: ChildComp;
}

class ParentComp extends Component<ParentCompCtx, ParentCompProps> {
    public static factory: Factory<ParentComp>;
    public static readonly changeBitmask = {
        name: 1 << 0
    };

    public $$processUpdate(newProps: ParentCompProps, _: {}, changeMap: number): void {
        if (changeMap & ParentComp.changeBitmask.name) {
            this.context.text1.textContent = newProps.name;
            runtime.updateProps(this.context.childComp1 as ChildComp, (p: ParentCompProps) => {
                p.name = newProps.name;
                return ChildComp.changeBitmask.name;
            });
        }
    }
}

ParentComp.factory = {
    unique: Symbol('ParentComp'),
    toString: props => `<div class="parent">
      Hello <!-- start props.name -->${props.name}<!-- end props.name --> from parent
      ${ChildComp.factory.toString(props)}
    </div>`,
    hydrate: (root, props) => new ParentComp(
        {
            root,
            text1: root.childNodes[2],
            childComp1: ChildComp.factory.hydrate(root.children[0] as HTMLElement, props)
        }, props, {}),
    initialState: (_: any) => ({})
};

interface ChildCompProps { name: string; }
interface ChildCompCtx extends Dom { text1: Text; }

// tslint:disable-next-line: max-classes-per-file
class ChildComp extends Component<ChildCompCtx, ChildCompProps> {
    public static factory: Factory<ChildComp>;
    public static readonly changeBitmask = {
        name: 1 << 0
    };

    public $$processUpdate(newProps: ChildCompProps, _: {}, changeMap: number): void {
        if (changeMap & ChildComp.changeBitmask.name) {
            this.context.text1.textContent = newProps.name;
        }
    }
}

ChildComp.factory = {
    unique: Symbol('ChildComp'),
    toString: (props: { name: string }) => `<div class="child">Greetings <!-- start props.name -->${props.name}<!-- end props.name --> from child</div>`,
    hydrate: (root, props) => new ChildComp({
        root,
        text1: root.childNodes[2] as Text,
    }, props, {}),
    initialState: (_: any) => ({})
};

export const runExample = (element: HTMLElement) => {
    let count = 1;
    const name = 'Sir Gaga';
    const comp = runtime.render(element, ParentComp.factory, { name })!;

    const i = setInterval(() => {
        runtime.updateProps(comp as ParentComp, (p:ParentCompProps) => {
            p.name = `${name} the ${count++}`;
            return ParentComp.changeBitmask.name;
        });
    }, 50);
    return () => {
        clearInterval(i);
    };
};