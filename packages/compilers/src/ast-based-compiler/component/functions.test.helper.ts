import { evalAst, CompDefinition } from '@tsx-air/compiler-utils';
import { asFunction, generateStateAwareMethod } from './function';

const mockComp = {
    changeBitmask: {
        's.a': 1,
        's.b': 2
    },
    prototype: {}
};
export const mockRuntime = {
    console: {
        log: (..._args: string[]) => void 0
    },
    TSXAir: {
        runtime: {
            // @ts-ignore
            updateState: (scope, mutator) => mutator({ s: {} }),
        }
    },
    WithStateChangeOnly: mockComp,
    WithVolatileFunction: mockComp,
};

export const evalStateSafeFunc = (comp: CompDefinition, props: any = {}, state: any = {}, volatile: any = {}) => {
    const asFunc = evalAst(asFunction(generateStateAwareMethod(comp, comp.functions[0])), mockRuntime);
    return (...args: any[]) =>
        asFunc.apply({ props, state, volatile }, args);
}