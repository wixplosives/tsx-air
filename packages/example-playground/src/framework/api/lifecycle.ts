import { noop } from '../runtime/utils';

type SetHandler<T = () => void, R=void> = (handler: T) => R;
interface LifeCycle {
    once: <T>(cb: ()=>T)=>T;
    afterMount: SetHandler<(ref: HTMLElement) => void>;
    onUnmount: SetHandler;
    beforeUpdate: SetHandler<(props: any, state: any) => void>;
    afterUpdate: SetHandler;
    // for stuff like mutable inner state and other convoluted state changes
    render: () => Promise<void>;
}

const apiToCompiledHooks = noop;

export const lifecycle: LifeCycle = {
    once: apiToCompiledHooks as any,
    afterMount: apiToCompiledHooks,
    onUnmount: apiToCompiledHooks,
    beforeUpdate: apiToCompiledHooks,
    afterUpdate: apiToCompiledHooks,
    render: () => Promise.resolve()
};