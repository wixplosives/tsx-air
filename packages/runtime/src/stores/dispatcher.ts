import { Observable, Listener } from './types';

export class Dispatcher implements Observable {
    $listeners = new Set<Listener>();
    $target: any;
    $subscribe = (cb: Listener) => {
        if (cb) {
            this.$listeners.add(cb);
        }
    };
    $unsubscribe = (cb: Listener) => {
        this.$listeners.delete(cb);
    };
    $dispatch(change: number) {
        for (const listener of this.$listeners) {
            listener(this.$target, change);
        }
    }
}
