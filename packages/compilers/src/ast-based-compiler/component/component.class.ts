import { CompDefinition } from './../../../../compiler-utils/src/analyzers/types';
import { generateDomBindings, cClass, asStatic, cPublic, cObject, FileTransformerAPI } from '@tsx-air/compiler-utils';
import flatMap from 'lodash/flatMap';
import { createProcessUpdateForComp } from './process.update';
import { generateToString } from './factory/to.string';
import { generateHydrate } from './factory/hydrate';
import { generateInitialState } from './factory/initial.state';
import { createChangeBitMask } from './bitmask';

export const generateComponentClass = (comp: CompDefinition, api: FileTransformerAPI) => {
    const importedComponent = api.ensureImport('Component', '@tsx-air/framework');
    const binding = generateDomBindings(comp);
    const store = flatMap(comp.stores, s => Object.keys(s.variables.accessed).map(k => `${s}-${k}`));
    const info = comp.jsxRoots[0];
    const res = cClass(
        comp.name!,
        importedComponent,
        undefined, [
        asStatic(cPublic('factory', cObject({
            toString: generateToString(info, comp),
            hydrate: generateHydrate(info, comp, binding),
            initialState: generateInitialState(info, comp)
        }))),
        asStatic(cPublic('changeBitmask',
            createChangeBitMask([...comp.usedProps.map(prop => prop.name), ...store]))),
        cPublic('$$processUpdate', createProcessUpdateForComp(comp, binding))
    ]);
    return res;
};