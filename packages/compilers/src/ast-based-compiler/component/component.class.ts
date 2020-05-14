import { cClass, cObject, FileTransformerAPI, CompDefinition, cStatic } from '@tsx-air/compiler-utils';
import { generateUpdateView } from './update.view';
import { generateToString } from './factory/to.string';
import { generateHydrate } from './factory/hydrate';
import { generateInitialState } from './factory/initial.state';
import { generateChangeBitMask } from './bitmask';
import { generateDomBindings } from '../../common/dom.binding';
import { generatePreRender } from './prerender';
import { generateMethods } from './function';
import { generateAfterMount } from './event.handlers';

export const generateComponentClass = (comp: CompDefinition, api: FileTransformerAPI) => {
    const importedComponent = api.ensureImport('Component', '@tsx-air/framework');
    const binding = generateDomBindings(comp);
    const res = cClass(
        comp.name!,
        importedComponent,
        undefined, [
        cStatic('factory', cObject({
            toString: generateToString(comp),
            hydrate: generateHydrate(comp, binding),
            initialState: generateInitialState(comp),
        })),
        cStatic('changeBitmask', generateChangeBitMask(comp)),
        ...generateMethods(comp),
        ...generateAfterMount(comp, binding),
        ...generatePreRender(comp),
        generateUpdateView(comp, binding),
    ]);
    return res;
};