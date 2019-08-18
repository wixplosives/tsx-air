import { TsxAirNode } from '../runtime';

type OnMountListener = (ref: HTMLElement) => void;
type OnUnmountListener = () => void;
type OnBeforeChangeListener<T> = (props: T) => void;
type OnAfterChangeListener = () => void;


const noop = (..._args: any[]) => void (0);

class Listeners<PROPS> {
    public onMount: OnMountListener = noop;
    public onUnmount: OnUnmountListener = noop;
    public onBeforeChange: OnBeforeChangeListener<PROPS> = noop;
    public onAfterChange: OnAfterChangeListener = noop;
}

const listeners = new WeakMap<TsxAirNode<any>, Listeners<any>>();

let active: TsxAirNode<any>;

export function setComponentBeingCerated<T>(comp: TsxAirNode<T>) {
    active = comp;
    listeners.set(active, new Listeners<T>());
}

export function onMount (cb: OnMountListener ) {
    listeners.get(active)!.onMount = cb;
}

export function onUnmount (cb: OnUnmountListener) {
    listeners.get(active)!.onUnmount = cb;
}

export function onBeforeChange<T>(cb: OnBeforeChangeListener<T>) {
    listeners.get(active)!.onBeforeChange = cb;
}

export function onAfterChange(cb: () => void) {
    listeners.get(active)!.onAfterChange = cb;
}
