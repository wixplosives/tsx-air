import { Component } from '..';
import { StoreData, Store } from './types';

export class StoresRegistry {
    private stores = new WeakMap<any, Record<string, Store>>();
    
    getStore(instance: any, id: string) {
        const instanceStores = this.stores.get(instance);
        return instanceStores && instanceStores[id];
    }

    registerStore<T extends StoreData>(instance: any, id: string, store: Store<T>) {
        const instanceStores = this.stores.get(instance) || {};
        instanceStores[id] = store;
        if (Component.is(instance)) {
            if (instance.stores) {
                instance.stores[id] = store;
            }
            store.$subscribe(instance.storeChanged);
        }
        this.stores.set(instance, instanceStores);
    }
}