import { cClass, FileTransformerAPI, cStatic, asAst } from '@tsx-air/compiler-utils';
import { generateUpdateView } from '../update.view';
import { FragmentData } from './jsx.fragment';
import ts from 'typescript';
import { generateVirtualComponents } from './virtual.comp';
import { generateToString } from './to.string';
import { generateHydrate } from './hydrate';

export const generateFragmentClass = (fragment: FragmentData, api: FileTransformerAPI) => {
    const importedFragment = api.ensureImport('Fragment', '@tsx-air/framework');
    api.ensureImport('Factory', '@tsx-air/framework');
    const frag = cClass(
        fragment.id,
        importedFragment,
        undefined, false, [
        cStatic('factory', asAst(`new Factory(${fragment.id}, ${fragment.comp.name}.changesBitMap)`) as ts.Expression),
        ...generateUpdateView(fragment),
        generateToString(fragment),
        generateHydrate(fragment),
        ...generateVirtualComponents(fragment),
    ]);
    return frag;
};