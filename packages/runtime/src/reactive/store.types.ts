type AllowedKeys = Exclude<string, ReservedKeys>;
type ReservedKeys = keyof CompiledStore & keyof Observable;

export interface Observable {
    $subscribe: (cb: Listener) => void;
    $unsubscribe: (cb: Listener) => void;
}

export type Listener<T = any> = (store: CompiledStore<T>, changed: number) => void;
export interface CompiledStore<T extends StoreData = any> {
    $bits: {
        [key in keyof T]: number;
    };
    $set: (p: StoreData) => void;
    $readBits: number;
}
export type Store<T extends StoreData = any> = Observable & CompiledStore & T;
export type StoreData = Record<AllowedKeys, any>;
