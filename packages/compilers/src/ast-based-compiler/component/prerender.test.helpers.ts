import { asFunction, nameFunctions } from './function';
import { CompDefinition, evalAst } from '@tsx-air/compiler-utils';
import { mapValues } from 'lodash';
import { generatePreRender } from './prerender';
import { tagHandlersUsed } from './event.handlers';
import { mockRuntime } from './functions.test.helper';
export { mockRuntime } from './functions.test.helper';

const evalPreRenderAsFunc = (comp: CompDefinition) => {
    nameFunctions(comp);
    tagHandlersUsed(comp);
    for (const f of generatePreRender(comp)) {
        return evalAst(asFunction(f), mockRuntime) as (props: any, state: any) => any;
    }
    return undefined;
};

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
