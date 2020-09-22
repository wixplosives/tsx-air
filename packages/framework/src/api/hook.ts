
interface HookPrep<T> {
    (...args: any[]): HookInst<T>;
    isHook: true;
}

interface HookInst<T> {
    execute: () => T;
    isHookInst: true;
}

export const Hook = <T>(_action: (...args: any[]) => T) => ({}) as HookPrep<T>;


type USE<H> = H extends HookInst<infer T> ? T : never;
export const use = <T>(_hook: T) => ({}) as USE<T>;
