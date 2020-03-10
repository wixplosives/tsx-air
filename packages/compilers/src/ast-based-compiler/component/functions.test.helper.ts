import { evalAst, CompDefinition, printAst } from '@tsx-air/compiler-utils';
import { asFunction, generateStateAwareMethod } from './function';
import { TSXAir } from '@tsx-air/framework/src';

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
            updateState: (scope, state, mutator) => mutator(state),
            flags: TSXAir.runtime.flags
        }
    },
    WithStateChangeOnly: mockComp,
    WithVolatileFunction: mockComp,
};

export const evalStateSafeFunc = (comp: CompDefinition) =>
    evalAst(asFunction(generateStateAwareMethod(comp, comp.functions[0])), mockRuntime) as (props: any, state: any, volatile: any, ...args: any[]) => any;