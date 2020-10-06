import { Component } from './component';
import { Store, Runtime, Observable } from '..';
import { Hook } from './hook';

export interface WithUserCode<T> {
    userCode(): T;
}

export class Reactive {
    get owner(): Component | undefined {
        return Component.is(this.parent) ? this.parent : this.parent?.owner;
    }

    static is(x: any): x is Reactive {
        return x && x instanceof Reactive;
    }

    parent: Reactive | undefined;
    stores: Record<string, Store> = {};
    hooks: Record<string, Hook> = {};
    modified: Map<Store, number> = new Map();

    protected hasStoreChanges: boolean = false;

    constructor(
        parent: any,
        readonly $rt: Runtime
    ) {
        while (parent && !Reactive.is(parent)) {
            parent = parent.parent;
        }
        this.parent = parent as Reactive;
    }

    storeChanged = (modifiedStore: Store, changed: number) => {
        this.hasStoreChanges = true;
        this.modified.set(modifiedStore, (this.modified.get(modifiedStore) || 0) | changed);
        this.$rt.updater.invalidate(this);
    };

    mounted() {
        for (const child of Object.values(this.hooks)) {
            child.mounted();
        }
    }

    unmounted() {
        for (const child of Object.values(this.hooks)) {
            child.unmounted();
        }
    }

    dispose() {
        for (const comp of Object.values(this.hooks)) {
            comp.dispose();
        }
        for (const store of Object.values(this.stores) as Observable[]) {
            store.$unsubscribe(this.storeChanged);
        }
    }
}
