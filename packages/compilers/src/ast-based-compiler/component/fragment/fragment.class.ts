import { cClass, FileTransformerAPI, asAst, UserCode } from '@tsx-air/compiler-utils';
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

export function* generateFragments(code: UserCode, fragments: FragmentData[], api: FileTransformerAPI) {
    for (const fragment of fragments) {
        if (!fragment.isComponent) {
            api.ensureImport('Fragment, VirtualElement', '@tsx-air/runtime');
            yield generateFragmentClass(fragment, api);
            yield asAst(`${code.name}.${fragment.id}=${fragment.id}`) as ts.Statement;
        }
    }
}