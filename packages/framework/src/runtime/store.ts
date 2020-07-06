import { TSXAir } from '../api/types';

type AllowedKeys = Exclude<string, ReservedKeys>;
type ReservedKeys = keyof CompiledStore & keyof Observable;

export type Observable = {
    $subscribe: (cb: Listener) => void;
    $unsubscribe: (cb: Listener) => void;
};

class Dispatcher implements Observable {
    $listeners = new Set<Listener>();
    $target: any;
    $subscribe(cb: Listener) {
        this.$listeners.add(cb);
    }
    $unsubscribe(cb: Listener) {
        this.$listeners.delete(cb);
    }
    $dispatch(change: number) {
        for (const listener of this.$listeners) {
            listener(this.$target, change);
        }
    }
}

export type CompiledStore<T extends StoreData = any> = {
    $bits: {
        [key in keyof T]: number;
    };
};

export type Store<T extends StoreData=any> = Observable & CompiledStore & T;
export type StoreData = Record<AllowedKeys, any>;
type Listener<T = any> = (store: CompiledStore<T>, changed: number) => void;

export function store<T extends StoreData>(initialState: T, instance:any, name:string): Store<T> {
    const existingStore = TSXAir.runtime.getStore(instance, name);
    if (existingStore) {
        return existingStore;
    }
    let bit = 0;
    const $bits: Record<string, number> = {};
    for (const [key] of Object.entries(initialState)) {
        $bits[key] = 1 << bit++;
    }
    const dispatcher = new Dispatcher();
    const proxy = new Proxy(initialState, {
        get: (t: T, p: keyof Store<T>) => {
            switch (p) {
                case '$bits':
                    return $bits;
                case '$subscribe':
                    return dispatcher.$subscribe;
                case '$unsubscribe':
                    return dispatcher.$unsubscribe;
                default:
                    return t[p];
            }
        },
        set: (t: T, p: keyof Store<T>, value: any) => {
            if (p in t) {
                t[p] = value;
                dispatcher.$dispatch($bits[p as string]);
            } else {
                throw new Error('Invalid store property: only properties that were defined in initialState may be changed');
            }
            return true;
        }
    }) as Store<T>;
    dispatcher.$target = proxy;
    return proxy;
}
