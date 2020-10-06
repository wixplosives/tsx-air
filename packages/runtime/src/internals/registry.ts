
export class Registry<T> {
    private items = new WeakMap<any, Record<string, T>>();

    constructor(readonly afterRegister: (instance: any, id: string, item: T) => void) {
    }

    get<D = T>(instance: any, id: string, defaultValue?: D): T | D {
        const instanceStores = this.items.get(instance);
        return (instanceStores && instanceStores[id]) || defaultValue as D;
    }

    register(instance: any, id: string, item: T) {
        const instanceStores = this.items.get(instance) || {};
        instanceStores[id] = item;
        this.afterRegister(instance, id, item);
        this.items.set(instance, instanceStores);
    }
}