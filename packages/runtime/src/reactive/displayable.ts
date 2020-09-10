import { Component, Fragment } from '.';
import { Runtime, Store } from '..';
import { Reactive } from './reactive';

export type Elm = HTMLElement | Text | Displayable | Component | Fragment;

interface Ctx {
    root: Elm | null;
    expressions: ExpressionDom[];
    elements: HTMLElement[];
    displayables: Record<string, Displayable>;
}

export interface DisplayableData {
    props: any;
    parent?: Displayable;
}
export class Displayable extends Reactive implements DisplayableData {
    get fullKey(): string {
        return this.parent ? `${this.parent.fullKey}${this.key}` : this.key;
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
        displayables: {}
    };

    parent: Displayable | undefined;
    stores!: Record<string, Store> & Record<'$props', Store>;
    volatile!: any;
    
    protected hasStoreChanges: boolean=false;

    constructor(
        readonly key: string,
        parent: DisplayableData | undefined,
        readonly $rt: Runtime
    ) {
        super(parent as any, $rt);        
    }

    mounted() {
        for (const child of Object.values(this.ctx.displayables)) {
            child.mounted();
        }
        super.mounted();
    }

    unmounted() {
        for (const child of Object.values(this.ctx.displayables)) {
            child.unmounted();
        }
        super.unmounted();
    }

    dispose() {
        for (const comp of Object.values(this.ctx.displayables)) {
            comp.dispose();
        }
        super.dispose();
    }

    hydrate(_preRender: DisplayableData, _target: HTMLElement): void { throw new Error(`not implemented`); }
    
    toString(): string { throw new Error(`not implemented`); }
}

export interface ExpressionDom {
    start: Comment | HTMLElement;
    end: Comment;
    value: Elm[];
}