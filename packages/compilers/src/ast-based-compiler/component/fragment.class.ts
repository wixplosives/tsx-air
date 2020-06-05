import { cClass, cObject, FileTransformerAPI, CompDefinition, cStatic, asAst } from '@tsx-air/compiler-utils';
import { generateUpdateView } from './update.view';
import { generateToString } from './factory/to.string';
import { generateHydrate } from './factory/hydrate';
import { generateChangeBitMask } from './bitmask';
import { generateDomBindings } from '../../common/dom.binding';
import { generatePreRender } from './prerender';
import { generateAfterMount } from './event.handlers';
import { FragmentData } from './jsx.fragment';
import ts from 'typescript';

export const generateFragmentClass = (comp: CompDefinition, fragment:FragmentData, api: FileTransformerAPI) => {
    const importedFragment = api.ensureImport('Fragment', '@tsx-air/framework');
    const binding = generateDomBindings(comp);
    const res = cClass(
        '',
        importedFragment,
        undefined, [
        cStatic('factory', asAst(`new Factory(${comp.name}.${fragment.id}, ${comp.name}.changesBitMap)`) as ts.Expression),
        // ...generateAfterMount(comp, binding),
        generateUpdateView(comp, binding),
        generateToString()
    ]);
    return res;
};