import { noop } from '../runtime/utils';

type SetHandler<T> = (handler: T) => void;
interface LifeCycle {
    afterMount: SetHandler<(ref: HTMLElement) => void>;
    onUnmount: SetHandler<() => void>;
    beforeUpdate: SetHandler<(props: any, state: any) => void>;
    afterUpdate: SetHandler<() => void>;
    // for stuff like mutable inner state and other convoluted state changes
    requestRender: SetHandler<() => void>;
}

const apiToCompiledHooks = noop;

export const lifecycle: LifeCycle = {
    afterMount: apiToCompiledHooks,
    onUnmount: apiToCompiledHooks,
    beforeUpdate: apiToCompiledHooks,
    afterUpdate: apiToCompiledHooks,
    requestRender: apiToCompiledHooks
};