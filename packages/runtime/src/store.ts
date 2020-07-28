import { getInstance as $rt, Runtime } from '.';

type AllowedKeys = Exclude<string, ReservedKeys>;
type ReservedKeys = keyof CompiledStore & keyof Observable;

export interface Observable {
    $subscribe: (cb: Listener) => void;
    $unsubscribe: (cb: Listener) => void;
}

class Dispatcher implements Observable {
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

export interface CompiledStore<T extends StoreData = any> {
    $bits: {
        [key in keyof T]: number;
    };
    $set: (p: StoreData) => void;
    $readBits: number;
}

export type Store<T extends StoreData = any> = Observable & CompiledStore & T;
export type StoreData = Record<AllowedKeys, any>;
type Listener<T = any> = (store: CompiledStore<T>, changed: number) => void;

export function store<T extends StoreData>(initialState: T, instance: { $rt: Runtime }, name: string): Store<T> {
    const existingStore = instance.$rt.getStore(instance, name);
    if (existingStore) {
        existingStore.$readBits = 0;
        return existingStore;
    }
    let bit = 0;
    const $bits: Record<string, number> = {};
    for (const [key] of Object.entries(initialState)) {
        $bits[key] = 1 << bit++;
    }
    let $readBits = 0;
    const dispatcher = new Dispatcher();
    const proxy = new Proxy(initialState, {
        get: (t: T, p: keyof Store<T>) => {
            switch (p) {
                case '$bits':
                    return $bits;
                case '$readBits':
                    return $readBits;
                case '$subscribe':
                    return dispatcher.$subscribe;
                case '$unsubscribe':
                    return dispatcher.$unsubscribe;
                case '$set':
                    return (newVal: StoreData) => {
                        let changes = 0;
                        for (const [key, val] of Object.entries(newVal)) {
                            if (initialState[key] !== val || !(key in initialState)) {
                                if (!$bits[key]) {
                                    if (bit >= 64) {
                                        throw new Error(`Invalid usage of store: over 64 fields`);
                                    }
                                    $bits[key] = 1 << bit++;
                                }
                                // @ts-ignore
                                initialState[key] = val;
                                changes |= $bits[key];
                            }
                        }
                        for (const key of Object.keys(initialState)) {
                            if (!(key in newVal)) {
                                delete initialState[key];
                                changes |= $bits[key];
                            }
                        }
                        dispatcher.$dispatch(changes);
                    };
                default:
                    $readBits |= $bits[p as string];
                    return t[p];
            }
        },
        set: (t: T, p: keyof Store<T>, value: any) => {
            switch (p) {
                case '$readBits':
                    $readBits = value;
                    return true;
                default:
                    if (p in t) {
                        if (t[p] !== value) {
                            t[p] = value;
                            dispatcher.$dispatch($bits[p as string]);
                        }
                    } else {
                        throw new Error('Invalid store property: only properties that were defined in initialState may be changed');
                    }
                    return true;
            }
        }
    }) as Store<T>;
    dispatcher.$target = proxy;
    $rt().registerStore(instance, name, proxy);
    return proxy;
}
