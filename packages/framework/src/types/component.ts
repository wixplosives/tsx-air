import { Factory, CompFactory } from './factory';
import isFunction from 'lodash/isFunction';
import { TSXAir } from '../api/types';

export type Elm = HTMLElement | Text | Displayable | Component | Fragment;
export interface Dom {
    root: Elm;
}

export interface DisplayableData {
    props: any;
    state?: any;    
}
export abstract class Displayable{
    public static factory: Factory<any>;

    constructor(
        readonly key: string,
        readonly props: any,
        readonly state: any,
        readonly volatile: any,
    ) {
        requestAnimationFrame(() => this.$afterMount(this.ctx.root));
        this.innerKey = TSXAir.runtime.getUniqueKey();
    }
    $afterMount(_ref: Elm) {/** add event listeners */ }
    $afterUnmount() {/** dispose of stuff */ }
    readonly changesBitMap!: Record<string, number>;
    readonly innerKey!: string;
    readonly ctx: Record<string, Elm> = {};

    abstract $updateView(changes: number): void;
    abstract toString(): string;
    abstract dispose(): void;
    getDomRoot(): HTMLElement | Text {
        const { root } = this.ctx;
        if (isDisplayable(root)) {
            return root.getDomRoot();
        }
        if (root instanceof HTMLElement || root instanceof Text) {
            return root;
        }
        throw new Error(`Invalid Displayable: root is not a Displayable/HTMLElement`);
    }
    abstract hydrate(target: HTMLElement): void;
}

export function isDisplayable(x: any): x is Displayable {
    return x && isFunction(x.$updateView);
}

export abstract class Fragment extends Displayable {
    constructor(
        readonly key: string,
        readonly parentComp: Component
    ) {
        super(key, parentComp.props, parentComp.state, parentComp.volatile);
    }
}

export function isFragment(x: any): x is Component {
    return x && isComponent(x.parentComp) && isDisplayable(x);
}

export function isFragmentType(x: any): x is typeof Fragment {
    return x.prototype instanceof Fragment;
}

export abstract class Component extends Displayable {
    public static factory: CompFactory<any>;

    constructor(
        readonly key: string,
        readonly props: any,
        readonly state: any,
        volatile = {}
    ) {
        super(key, props, state, volatile);
    }

    *$afterUpdate(): IterableIterator<void> {/** Noop */ }
    abstract $preRender(): VirtualElement;

}

export function isComponent(x: any): x is Component {
    return x && isFunction(x.$preRender) && isDisplayable(x);
}

export function isComponentType(x: any): x is typeof Component {
    return x.prototype instanceof Component;
}

export class VirtualElement {
    constructor(
        readonly type: any,
        readonly owner: Component,
        readonly props: any,
        readonly volatile: any,
        readonly state: any,
        readonly modified = 0,
        readonly key?: string
    ) { }

    withKey(key: string) {
        const { type, owner, props, volatile, state, modified } = this;
        return new VirtualElement(type, owner, props, volatile, state, modified, key);
    };
}

export function isVirtualElement(x: any): x is VirtualElement {
    return x instanceof VirtualElement;
}

export interface DomMarker {
    start: Comment | HTMLElement;
    end?: Comment;
}