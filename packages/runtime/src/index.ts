import { Runtime } from './runtime/runtime';
export * from './types';
export * from './stores';
export * from './api/component.external';
export { Runtime };
export * from './api/component.lifecycle';

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
