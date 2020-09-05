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

export const when = (target: Component, id: string, action: () => any, predicate: any[]) =>
    target.$rt.api.when(target, id, action, predicate);
export const memo = (target: Component, id: string, action: () => any, predicate: any[]) =>
    target.$rt.api.memo(target, id, action, predicate);
export const invalidate = (target: Displayable) =>
    target.$rt.updater.invalidate(Component.is(target) ? target : target.owner!);
export const afterMount = (target: Component, __: string, action: (rootRef: HTMLElement|Text) => void) => {
    if (!target.$afterMount.includes(action)) {
        target.$afterMount.push(action);
    }
};
// export function beforeUnmount(action: (rootRef: HTMLElement) => void, target:Component) {/* */}
export const afterDomUpdate = (target: Component, id: string, action: () => void, predicate: any[]) =>
    target.$rt.api.afterDomUpdate(target, id, action, predicate);
