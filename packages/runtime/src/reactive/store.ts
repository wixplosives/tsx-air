import { StoreData, Store } from './store.types';
import { Dispatcher } from '../internals/dispatcher';
import { Runtime } from '..';

export function store<T extends StoreData>(instance: { $rt: Runtime }, id: string, initialState: T): Store<T> {
    const { $rt: { stores } } = instance;
    const existingStore = stores.get(instance, id);
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
                    return t[p];
            }
        },
        set: (t: T, p: keyof Store<T>, value: any) => {
            switch (p) {
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
    stores.register(instance, id, proxy);
    return proxy;
}
