import { Factory, runtime, Component, Dom } from '@tsx-air/framework';

interface ParentCompProps { name: string; }
interface ParentCompCtx extends Dom {
    text1: ChildNode;
    childComp1: ChildComp;
}

export class ParentComp extends Component<ParentCompCtx, ParentCompProps> {
    public static factory: Factory<ParentComp>;
    public static readonly changeBitmask = {
        'props.name': 1 << 0
    };

    public updateView(newProps: ParentCompProps, _stores:{}, _volatile:{}, changeMap: number): void {
        if (changeMap & ParentComp.changeBitmask['props.name']) {
            this.context.text1.textContent = newProps.name;
            runtime.updateProps(this.context.childComp1 as ChildComp, (p: ParentCompProps) => {
                p.name = newProps.name;
                return ChildComp.changeBitmask['props.name'];
            });
        }
    }
}

ParentComp.factory = {
    unique: Symbol('ParentComp'),
    toString: props => `<div class="parent">
      Parent: <!-- start props.name -->${props.name}<!-- end props.name -->
      ${ChildComp.factory.toString(props)}
    </div>`,
    hydrate: (root, props, state) => new ParentComp(
        {
            root,
            text1: root.childNodes[2],
            childComp1: ChildComp.factory.hydrate(root.children[0] as HTMLElement, props)
        }, props, state!),
    initialState: (_: any) => ({})
};

interface ChildCompProps { name: string; }
interface ChildCompCtx extends Dom { text1: Text; }

// tslint:disable-next-line: max-classes-per-file
export class ChildComp extends Component<ChildCompCtx, ChildCompProps> {
    public static factory: Factory<ChildComp>;
    public static readonly changeBitmask = {
        'props.name': 1 << 0
    };

    public updateView(newProps: ChildCompProps, _stores:{}, _volatile:{}, changeMap: number): void {
        if (changeMap & ChildComp.changeBitmask['props.name']) {
            this.context.text1.textContent = newProps.name;
        }
    }
}

ChildComp.factory = {
    unique: Symbol('ChildComp'),
    toString: (props: { name: string }) => `<div class="child">Child: <!-- start props.name -->${props.name}<!-- end props.name --></div>`,
    hydrate: (root, props, $s) => new ChildComp({
        root,
        text1: root.childNodes[2] as Text,
    }, props, $s!),
    initialState: (_: any) => ({})
};
