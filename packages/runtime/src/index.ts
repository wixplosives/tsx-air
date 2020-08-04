import { Component, Displayable } from './types';
import { Runtime } from './runtime/runtime';
export * from './types';
export * from './stores';
export * from './api/component';
export { Runtime };

let runTimes: Record<string, Runtime> = {};
export function getInstance(id = 'default') {
    if (!runTimes[id]) {
        runTimes[id] = new Runtime();
    }
    return runTimes[id];
}

export function setInstance(id: string, instance: Runtime) {
    runTimes[id] = instance;
}

export function reset() {
    runTimes = {};
}

export const when = (predicate: any, action: () => any, target: Component, id: number) => target.$rt.api.when(predicate, action, target, id);
export const memo = (predicate: any, action: () => any, target: Component, id: number) => target.$rt.api.memo(predicate, action, target, id);
export const invalidate = (target: Displayable) => target.$rt.renderer.invalidate(Component.is(target) ? target : target.owner!);
// export const afterMount = (action:(rootRef: HTMLElement)=>void, target:Component) => target.$rt.when(predicate, action, target, id);
// export function beforeUnmount(action: (rootRef: HTMLElement) => void, target:Component) {/* */}
// export function afterDomUpdate(predicate:any, action: () => void) {/* */}