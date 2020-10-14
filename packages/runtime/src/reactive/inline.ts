import { AfterMountCb, AfterUnmountCb, AfterUpdateCb, Reactive, store, WithUserCode } from '.';

export class Inline<T = any> extends Reactive implements WithUserCode<any> {
    static is(x: any): x is Inline {
        return x && x instanceof Inline;
    }
    static isType(x: any): x is typeof Inline {
        return x && x.prototype && x.prototype instanceof Inline;
    }
    $afterMount: AfterMountCb[] = [];
    $afterUnmount: AfterUnmountCb[] = [];
    $afterDomUpdate: AfterUpdateCb[] = [];
    consecutiveChanges = new Map<AfterUpdateCb, number>();
    volatile: any;

    constructor(parent: Reactive) {
        super(parent, parent.$rt);
        this.stores.$props = this.owner!.stores.$props;
        this.stores.$props.$subscribe(this.storeChanged);
        this.stores.$args = store(this, '$args', {});
        this.volatile = { $props: this.stores.$props, $args: this.stores.$args };
    }

    updated() {
        this.$afterDomUpdate.forEach(fn => {
            this.hasStoreChanges = false;
            const consecutiveChanges = this.consecutiveChanges.get(fn) || 0;
            fn(this.owner!.domRoot, consecutiveChanges);
            this.consecutiveChanges.set(fn,
                this.hasStoreChanges ? consecutiveChanges + 1 : 0);
        });
        this.modified = new Map();
    }

    userCode(): T {
        throw new Error(`hook "userCode" not implemented: ` + this.constructor.name);
    }

    mounted() {
        super.mounted();
        this.$afterMount.forEach(i => i(this.owner!.domRoot));
        this.updated();
    }

    unmounted() {
        super.unmounted();
        this.$afterUnmount.forEach(fn => fn());
    }
}