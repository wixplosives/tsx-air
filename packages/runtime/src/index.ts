import { Runtime } from './runtime/runtime';
import * as utils from './utils';
export { Runtime, utils };
export * from './types';
export { store } from './store';

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