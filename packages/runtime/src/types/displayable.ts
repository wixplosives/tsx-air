import { Component, Fragment } from '.';
import { Runtime, Store, Observable } from '..';

export type Elm = HTMLElement | Text | Displayable | Component | Fragment;

interface Ctx {
    root: Elm | null;
    expressions: ExpressionDom[];
    elements: HTMLElement[];
    components: Record<string, Displayable>;
}

export interface DisplayableData {
    props: any;
    parent?: Displayable;
}
export class Displayable implements DisplayableData{
    protected hasStoreChanges: boolean=false;

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
        const { HTMLElement, Text } = this.$rt;
        if (root instanceof HTMLElement || root instanceof Text) {
            return root;
        }
        throw new Error(`Invalid Displayable: root is not a Displayable/HTMLElement`);
    }
    get props(){
        return this.stores.$props;
    }

    static is(x: any): x is Displayable {
        return x && x instanceof Displayable;
    }
    readonly innerKey!: string;
    readonly ctx: Ctx = {
        root: null,
        expressions: [],
        elements: [],
        components: {}
    };
    parent: Displayable | undefined;
    stores!: Record<string, Store> & Record<'$props', Store>;
    volatile!: any;
    modified: Map<Store, number> = new Map();

    constructor(
        readonly key: string,
        parent: DisplayableData | undefined,
        readonly $rt: Runtime
    ) {
        while (parent && !Displayable.is(parent)) {
            parent = parent.parent;
        }
        this.parent = parent;
    }

    storeChanged = (modifiedStore: Store, changed: number) => {
        this.hasStoreChanges = true;
        this.modified.set(modifiedStore, (this.modified.get(modifiedStore) || 0) | changed);
        this.$rt.updater.invalidate(this);
    };

    mounted() {
        for (const child of Object.values(this.ctx.components)) {
            child.mounted();
        }
    }

    unmounted() {
        for (const child of Object.values(this.ctx.components)) {
            child.unmounted();
        }
    }

    dispose() {
        for (const comp of Object.values(this.ctx.components)) {
            comp.dispose();
        }
        for (const store of Object.values(this.stores) as Observable[]) {
            store.$unsubscribe(this.storeChanged);
        }
    }

    hydrate(_preRender: DisplayableData, _target: HTMLElement): void { throw new Error(`not implemented`); }
    
    toString(): string { throw new Error(`not implemented`); }
}

export interface ExpressionDom {
    start: Comment | HTMLElement;
    end: Comment;
    value: Elm[];
}