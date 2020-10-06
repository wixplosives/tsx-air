import { Reactive, WithUserCode } from './reactive';
import { AfterMountCb, AfterUnmountCb, AfterUpdateCb } from '..';
import { store } from './store';

export function use(instance: Reactive, id: string, HookType: new (p: Reactive) => Hook, args: any[]) {
    const { $rt } = instance;
    const { hooks } = $rt;
    let hook: Hook = hooks.get(instance, id);
    if (!hook) {
        if (!Hook.isType(HookType)) {
            throw new Error(`Invalid 'use': argument must be a Hook`);
        }
        hook = new HookType(instance);
        hooks.register(instance, id, hook);
    }
    hook.stores.$props.$set(args);
    return $rt.getHookValue(hook);
}

export class Hook<T = any> extends Reactive implements WithUserCode<any> {
    static is(x: any): x is Hook {
        return x && x instanceof Hook;
    }
    static isType(x: any): x is Hook {
        return x && x.prototype && x.prototype instanceof Hook;
    }
    $afterMount: AfterMountCb[] = [];
    $afterUnmount: AfterUnmountCb[] = [];
    $afterDomUpdate: AfterUpdateCb[] = [];
    consecutiveChanges = new Map<AfterUpdateCb, number>();

    constructor(parent: Reactive) {
        super(parent, parent.$rt);
        this.stores.$props = store(this, '$props', {});
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