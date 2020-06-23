import { TSXAir, Component, Fragment, Factory } from "..";

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
    static factory: Factory<any>;
    static is(x: any): x is Displayable {
        return x && x instanceof Displayable;
    }

    constructor(
        readonly key: string,
        parent: Displayable | DisplayableData | undefined,
        public props: any,
        public state: any,
        public volatile: any,
    ) {
        // requestAnimationFrame(() => this.$afterMount());
        this.innerKey = TSXAir.runtime.getUniqueKey();
        while (parent && !Displayable.is(parent)) {
            parent = parent.parent;
        }
        this.parent = parent;
    }
    afterMount(_ref: Elm) {/** add event listeners */ }
    afterUnmount() {/** dispose of stuff */ }
    readonly changesBitMap!: Record<string, number>;
    readonly innerKey!: string;
    readonly ctx: Ctx = {
        root: null,
        expressions: [],
        elements: [],
        components: {}
    };
    parent: Displayable | undefined;

    get fullKey(): string {
        return this.parent ? `${this.parent.fullKey}${this.key}` : this.key;
    }
    get owner(): Component | undefined {
        return Component.is(this.parent) ? this.parent : this.parent?.owner;
    }

    dispose() { };
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
    hydrate(_preRender: DisplayableData, _target: HTMLElement): void { throw new Error(`not implemented`); }
    toString(): string { throw new Error(`not implemented`); }
}

export interface ExpressionDom {
    start: Comment | HTMLElement;
    end: Comment;
    value: Elm[];
}