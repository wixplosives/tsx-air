import {  cClass, cObject, FileTransformerAPI, CompDefinition, cStatic } from '@tsx-air/compiler-utils';
import { createProcessUpdateMethod } from './process.update';
import { generateToString } from './factory/to.string';
import { generateHydrate } from './factory/hydrate';
import { generateInitialState } from './factory/initial.state';
import { generateChangeBitMask } from './bitmask';
import { eventHandlers } from './event.handlers';
import { generateDomBindings } from '../../common/dom.binding';

export const generateComponentClass = (comp: CompDefinition, api: FileTransformerAPI) => {
    const importedComponent = api.ensureImport('Component', '@tsx-air/framework');
    const binding = generateDomBindings(comp);
    const info = comp.jsxRoots[0];
    const res = cClass(
        comp.name!,
        importedComponent,
        undefined, [
        cStatic('factory', cObject({
            toString: generateToString(info, comp),
            hydrate: generateHydrate(comp, binding),
            initialState: generateInitialState(comp)
        })),
        cStatic('changeBitmask', generateChangeBitMask(comp)),
        createProcessUpdateMethod(comp, binding),
        ...eventHandlers(comp, binding)
    ]);
    return res;
};