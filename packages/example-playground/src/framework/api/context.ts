import { Store } from './store';
import { Component } from '../types/component';

interface ContextApi {
    readonly $setBy: Component;
}

export type Context<T> = Store<T> & ContextApi;

export function getContext<T>(): Context<T> {
    return {} as Context<T>;
}

// tslint:disable-next-line: no-empty
export function setChildrenContext<T>(_store:Store<T>|T):void {
}