import { Reactive } from './reactive';
import { Runtime, AfterMountCb, AfterUnmountCb, AfterUpdateCb } from '..';

export interface HookFn {
    (...args: any[]): any;
    isHook: true;
}
function isHookFn(x: any): x is HookFn {
    return x && typeof x === 'function' && x.isHook === true;
}

export function use(instance: { $rt: Runtime }, id: string, hook: HookFn, args: any[]) {
    const { $rt: { hooks } } = instance;
    const missing = {};
    const existing = hooks.get(instance, id, missing);
    // Allow for undefined to be a value
    if (existing !== missing) {
        return existing;
    }
    if (!isHookFn(hook)) {
        throw new Error(`Invalid 'use': argument must be a Hook`);
    }
    const res = hook.apply(undefined, args);
    hooks.register(instance, id, res);
    return res;
}

export class Hook extends Reactive {
    static is(x: any): x is Hook {
        return x && x instanceof Hook;
    }
    $afterMount: AfterMountCb[] = [];
    $afterUnmount: AfterUnmountCb[] = [];
    $afterDomUpdate: AfterUpdateCb[] = [];
    consecutiveChanges = new Map<AfterUpdateCb, number>();

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