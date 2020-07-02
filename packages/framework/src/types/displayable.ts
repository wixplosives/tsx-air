import { TSXAir, Component, Fragment, Factory } from '..';

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
    parent?: Displayable;
}
export class Displayable {

    get fullKey(): string {
        return this.parent ? `${this.parent.fullKey}${this.key}` : this.key;
    }
    get owner(): Component | undefined {
        return Component.is(this.parent) ? this.parent : this.parent?.owner;
    }

    get domRoot(): HTMLElement | Text {
        const { root } = this.ctx;
        if (Displayable.is(root)) {
            return root.domRoot;
        }
        const { HTMLElement, Text } = TSXAir.runtime;
        if (root instanceof HTMLElement || root instanceof Text) {
            return root;
        }
        throw new Error(`Invalid Displayable: root is not a Displayable/HTMLElement`);
    }
    public static factory: Factory<any>;
    public static is(x: any): x is Displayable {
        return x && x instanceof Displayable;
    }
    public readonly changesBitMap!: Record<string, number>;
    public readonly innerKey!: string;
    public readonly ctx: Ctx = {
        root: null,
        expressions: [],
        elements: [],
        components: {}
    };
    public parent: Displayable | undefined;

    constructor(
        readonly key: string,
        parent: Displayable | DisplayableData | undefined,
        public props: any,
        public state: any,
        public volatile: any,
    ) {
        this.innerKey = TSXAir.runtime.getUniqueKey();
        while (parent && !Displayable.is(parent)) {
            parent = parent.parent;
        }
        this.parent = parent;
    }
    public afterMount(_ref: Elm) {/** add event listeners */ }
    public afterUnmount() {/** dispose of stuff */ }

    public dispose() {/** dispose of stuff */}    public hydrate(_preRender: DisplayableData, _target: HTMLElement): void { throw new Error(`not implemented`); }
    public toString(): string { throw new Error(`not implemented`); }
}

export interface ExpressionDom {
    start: Comment | HTMLElement;
    end: Comment;
    value: Elm[];
}