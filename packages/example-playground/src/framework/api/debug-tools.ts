import { ComponentInstance, Stateful, Stateless } from './../types/component';

export interface Stats {
    startFpsProbe: () => Promise<void>;
    stopsFpsProbe: () => void;
    getFps: () => number;
    components: ComponentsStats;
}

export interface ComponentsStats {
    live: WeakSet<ComponentInstance>;
    stateful: WeakSet<Stateful>;
    stateless: WeakSet<Stateless>;
    created: number;
    hydrated: number;
    disposed: number;
    suspended: WeakSet<ComponentInstance>;
    stateUpdates: number;
    stateUpdateCycles: number;
    propUpdates: number;
    propsUpdatesCycles: number;
}

let framesTiming: number[] | null = null;
const takeFrameTime = () => {
    if (framesTiming) {
        const time = performance.now();
        framesTiming = [...framesTiming, time].filter(t => t >= time - 1000);
        requestAnimationFrame(takeFrameTime);
    }
};
const waitForFrameRate = () => new Promise<void>(
    (resolve, reject) => {
        const check = () => {
            if (framesTiming) {
                if (framesTiming.length > 10) {
                    resolve();
                } else {
                    requestAnimationFrame(check);
                }
            } else {
                reject();
            }
        };
        check();
    });

export const stats: Stats = {
    startFpsProbe: async () => {
        if (framesTiming) {
            return await waitForFrameRate();
        }
        framesTiming = [];
        takeFrameTime();
    },
    stopsFpsProbe: () => {
        framesTiming = null;
    },
    getFps: () => {
        if (!framesTiming) {
            return 0;
        }
        const { 0: first, length } = framesTiming!;
        const duration = framesTiming![length - 1] - first;
        return Math.round((length - 1) / duration * 1000);
    },
    components: {} as ComponentsStats
};