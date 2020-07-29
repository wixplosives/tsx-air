import { cClass, FileTransformerAPI, asAst } from '@tsx-air/compiler-utils';
import { generateUpdateView } from '../update.view';
import { FragmentData } from './jsx.fragment';
import { generateVirtualComponents } from './virtual.comp';
import { generateToString } from './to.string';
import { generateHydrate } from './hydrate';
import ts from 'typescript';

export const generateFragmentClass = (fragment: FragmentData, _api: FileTransformerAPI) => {
    const frag = cClass(
        fragment.id,
        asAst(`Fragment`) as ts.Expression,
        undefined, false, [
        ...generateUpdateView(fragment),
        generateToString(fragment),
        generateHydrate(fragment),
        ...generateVirtualComponents(fragment, false),
    ]);
    return frag;
};