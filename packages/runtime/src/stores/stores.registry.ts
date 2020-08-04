import { Component } from '..';
import { StoreData, Store } from './types';

export class StoresRegistry {
    private stores = new WeakMap<any, Record<string, Store>>();
    
    getStore(instance: any, name: string) {
        const instanceStores = this.stores.get(instance);
        return instanceStores && instanceStores[name];
    }

    registerStore<T extends StoreData>(instance: any, name: string, store: Store<T>) {
        const instanceStores = this.stores.get(instance) || {};
        instanceStores[name] = store;
        if (Component.is(instance)) {
            if (instance.stores) {
                instance.stores[name] = store;
            }
            store.$subscribe(instance.storeChanged);
        }
        this.stores.set(instance, instanceStores);
    }
}