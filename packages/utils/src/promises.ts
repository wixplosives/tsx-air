export type TimeoutsPromise = Promise<void> & TimeoutsPromiseApi;
interface TimeoutsPromiseApi {
    cancel: () => void;
    pause: () => void;
    finish: () => void;
    setTimeout: (newDelay: number) => void;
}

export const delay = (msec: number) => {
    const api = {} as TimeoutsPromiseApi;

    const p = new Promise((resolve, reject) => {
        let timeoutId: number | undefined;
        api.cancel = () => reject(new Error('Cancelled'));
        api.pause = () => clearTimeout(timeoutId);
        api.finish = resolve;
        api.setTimeout = (newDelay: number) => {
            api.pause();
            timeoutId = setTimeout(resolve, newDelay);
        };
        api.setTimeout(msec);
    }) as TimeoutsPromise;
    Object.assign(p, api);
    return p;
};

export const duration = async (p:Promise<any>) => {
    const starTime = Date.now();
    await p;
    return Date.now() - starTime;
};