import { Factory, CompFactory } from './factory';
import isFunction from 'lodash/isFunction';
import { TSXAir } from '../api/types';

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

    abstract $updateView(changes: number): void;
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
    abstract hydrate(preRender: VirtualElement, target: HTMLElement): void;
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
        // @ts-ignore
        this.changesBitMap = parentComp.changesBitMap;
    }
    abstract toString(): string;
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

export class VirtualElement<T extends Component=Component> {
    constructor(
        readonly type: any,
        readonly owner?: T,
        readonly key?: string,
        readonly changeBitRemapping?: Map<number, number>,
        props?: any,
        volatile?: any,
        state?: any,
        public changes: number=0
    ) {
        this.props = props || owner?.props;
        this.state = state || owner?.state;
        this.volatile = volatile || owner?.volatile;
    }

    readonly props: any;
    readonly state: any;
    readonly volatile: any;

    withKey(key: string) {
        const { type, owner, props, volatile, state, changes, changeBitRemapping } = this;
        return new VirtualElement(type, owner, key, changeBitRemapping, props, volatile, state, changes);
    };
}

export function isVirtualElement(x: any): x is VirtualElement {
    return x instanceof VirtualElement;
}

export interface ExpressionDom {
    start: Comment | HTMLElement;
    end: Comment;
    value: Elm[];
}