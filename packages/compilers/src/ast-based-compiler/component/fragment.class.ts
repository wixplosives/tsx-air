import { cClass, cObject, FileTransformerAPI, CompDefinition, cStatic } from '@tsx-air/compiler-utils';
import { generateUpdateView } from './update.view';
import { generateToString } from './factory/to.string';
import { generateHydrate } from './factory/hydrate';
import { generateChangeBitMask } from './bitmask';
import { generateDomBindings } from '../../common/dom.binding';
import { generatePreRender } from './prerender';
import { generateMethods } from './function';
import { generateAfterMount } from './event.handlers';
import { FragmentData } from './jsx.fragment';

export const generateFragmentClass = (comp: CompDefinition, fragment:FragmentData, api: FileTransformerAPI) => {
    const importedFragment = api.ensureImport('Fragment', '@tsx-air/framework');
    const binding = generateDomBindings(comp);
    const res = cClass(
        '',
        importedFragment,
        undefined, [
        cStatic('factory', cObject({
            toString: generateToString(comp),
            hydrate: generateHydrate(comp, binding),
            render: generateRender(comp, binding)
        })),
        cStatic('changeBitmask', generateChangeBitMask(comp)),
        ...generateMethods(comp),
        ...generateAfterMount(comp, binding),
        ...generatePreRender(comp),
        generateUpdateView(comp, binding),
    ]);
    return res;
};