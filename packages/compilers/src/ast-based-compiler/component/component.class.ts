import { generateDomBindings, cClass, asStatic, cPublic, cObject, FileTransformerAPI, CompDefinition } from '@tsx-air/compiler-utils';
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
        asStatic(cPublic('factory', cObject({
            toString: generateToString(info, comp),
            hydrate: generateHydrate(info, comp, binding),
            initialState: generateInitialState(comp)
        }))),
        asStatic(cPublic('changeBitmask',
            generateChangeBitMask(comp))),
        cPublic('$$processUpdate', createProcessUpdateForComp(comp, binding))
    ]);
    return res;
};