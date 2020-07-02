type AllowedKeys = Exclude<string, '$bits' | '$data' | '$listeners' | '$subscribe' | '$unsubscribe' | '$dispatch'>;
type StoreValue = Record<AllowedKeys, any>;
export type CompiledStore<T extends StoreValue = any> = {
    $bits: {
        [key in keyof T]: number;
    };
    $data: T;
    $listeners: Set<StoreChangeCallback<T>>;
    $subscribe: (cb: StoreChangeCallback<T>) => void;
    $unsubscribe: (cb: StoreChangeCallback<T>) => void;
    $dispatch: (change: number) => void;
} & {
    [key in AllowedKeys]: number;
};
export type StoreChangeCallback<T = any> = (store: CompiledStore<T>, changed: number) => void;

export class BaseCompiledStore {
    public $listeners = new Set<StoreChangeCallback>();

    public $subscribe(cb: StoreChangeCallback) {
        this.$listeners.add(cb);
    }
    public $unsubscribe(cb: StoreChangeCallback) {
        this.$listeners.delete(cb);
    }
    public $dispatch(change: number) {
        for (const listener of this.$listeners) {
            listener(this as any, change);
        }
    }
}

export const store = <T extends StoreValue>(item: T) => item;
