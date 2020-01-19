import { Setter, Getter } from './../types/type-utils';

export interface StoreApi<T> {
    $set: Setter<T>;
    $get: Getter<T>;
    $subscribe: (onchange: () => void) => void;
}

export interface AsyncStoreApi<T> {
    $pending: boolean;
    $rejected?: any;
    $resolved?: T;
    $promise: Promise<T>;
}

export type Store<T> = T & StoreApi<T>;
export type AsyncStore<T> = Store<T> & AsyncStoreApi<T>;

export interface StoreFactory {
    <T>(initial: T): Store<T>;
    derived<T>(value: T): T;
    async<T>(p:Promise<T>): AsyncStore<T>;
}


export const store: StoreFactory = <T>(initial: T) => initial as Store<T>;
store.derived = (val: any) => val;
store.async = <T>(_p:Promise<T>) => ({}) as AsyncStore<T>;