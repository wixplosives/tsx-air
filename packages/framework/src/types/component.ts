import { Factory, CompFactory } from './factory';
import isFunction from 'lodash/isFunction';
import { TSXAir } from '../api/types';
import { VirtualElement } from './virtual.element';

export type Elm = HTMLElement | Text | Displayable | Component | Fragment;

interface Ctx {
    root: Elm | null;
    expressions: ExpressionDom[];
    elements: HTMLElement[];
    components: Record<string, Displayable>;
}

export interface DisplayableData {
    props: any;
    state?: any;
    owner?: Component;
}
export abstract class Displayable {
    public static factory: Factory<any>;

    constructor(
        readonly key: string,
        public props: any,
        public state: any,
        public volatile: any,
    ) {
        // requestAnimationFrame(() => this.$afterMount());
        this.innerKey = TSXAir.runtime.getUniqueKey();
    }
    $afterMount(_ref: Elm) {/** add event listeners */ }
    $afterUnmount() {/** dispose of stuff */ }
    readonly changesBitMap!: Record<string, number>;
    readonly innerKey!: string;
    readonly ctx: Ctx = {
        root: null,
        expressions: [],
        elements: [],
        components: {}
    };

    abstract dispose(): void;
    getDomRoot(): HTMLElement | Text {
        const { root } = this.ctx;
        if (isDisplayable(root)) {
            return root.getDomRoot();
        }
        const { HTMLElement, Text } = TSXAir.runtime;
        if (root instanceof HTMLElement || root instanceof Text) {
            return root;
        }
        throw new Error(`Invalid Displayable: root is not a Displayable/HTMLElement`);
    }
    abstract hydrate(preRender: DisplayableData, target: HTMLElement): void;
}

export function isDisplayable(x: any): x is Displayable {
    return x && x instanceof Displayable;
}

export abstract class Fragment extends Displayable {
    constructor(
        readonly key: string,
        readonly parentComp: Component
    ) {
        super(key, parentComp.props, parentComp.state, parentComp.volatile);
        // @ts-ignore
        this.changesBitMap = parentComp.changesBitMap;
    }
    abstract toString(): string;
    abstract $updateView(changes: number): void;
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
    abstract $preRender(): VirtualElement<any>;
}

export function isComponent(x: any): x is Component {
    return x && isFunction(x.$preRender) && isDisplayable(x);
}

export function isComponentType(x: any): x is typeof Component {
    return x.prototype instanceof Component;
}

export interface ExpressionDom {
    start: Comment | HTMLElement;
    end: Comment;
    value: Elm[];
}