import { Reactive } from './reactive';

export class Hook extends Reactive {
    static is(x: any): x is Hook {
        return x && x instanceof Hook;
    }
    
    $afterMount: Array<(ref: HTMLElement | Text) => void | (() => void)> = [];
    $afterUnmount: Array<() => void> = [];
    $afterDomUpdate: Array<(consecutiveChanges: number) => void> = [];
    consecutiveChanges = new Map<(consecutiveChanges: number) => void, number>();

    updated() {
        this.$afterDomUpdate.forEach(fn => {
            this.hasStoreChanges = false;
            const consecutiveChanges = this.consecutiveChanges.get(fn) || 0;
            fn(consecutiveChanges);
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