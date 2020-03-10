import { asFunction } from './function';
import { CompDefinition, evalAst, printAst } from '@tsx-air/compiler-utils';
import { mapValues } from 'lodash';
import { generatePreRender } from './prerender';

const mockComp = {
    changeBitmask: {},
    prototype: {}
};
const mockRuntime = {
    TSXAir: {
        runtime: {
            // @ts-ignore
            updateState: (scope, state, mutator) => mutator(state),
            flags: {}
        }
    },
    WithStateChangeOnly: mockComp,
    WithVolatileFunction: mockComp,
};

const evalPreRenderAsFunc = (comp: CompDefinition) =>
    evalAst(asFunction([...generatePreRender(comp)][0]), mockRuntime) as (props: any, state: any) => any;

export const getPreRenderOf = (components: object): any =>
    mapValues(components, (comp, name) => {
        try {
            return evalPreRenderAsFunc(comp);
        } catch (err) {
            throw new Error(`Failed to compile ${name}.preRender
                ${err}
                `);
        }
    });
