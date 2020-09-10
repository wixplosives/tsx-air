import { Runtime } from './runtime/runtime';
export * from './api/component.external';
export * from './api/component.lifecycle';
export * from './reactive';
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
