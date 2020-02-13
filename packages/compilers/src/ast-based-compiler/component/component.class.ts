import { generateDomBindings, cClass, cProperty, cObject, FileTransformerAPI, CompDefinition, cStatic } from '@tsx-air/compiler-utils';
import { createProcessUpdateForComp } from './process.update';
import { generateToString } from './factory/to.string';
import { generateHydrate } from './factory/hydrate';
import { generateInitialState } from './factory/initial.state';
import { generateChangeBitMask } from './bitmask';

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
        cStatic('changeBitmask',
            generateChangeBitMask(comp)),
        cProperty('$$processUpdate', createProcessUpdateForComp(comp, binding))
    ]);
    return res;
};