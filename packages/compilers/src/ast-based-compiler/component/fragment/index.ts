import { CompDefinition, FileTransformerAPI, asAst } from '@tsx-air/compiler-utils';
import { FragmentData } from './jsx.fragment';
import { generateFragmentClass } from './fragment.class';
import ts from 'typescript';

export function* generateFragments(comp: CompDefinition, api: FileTransformerAPI, fragments: FragmentData[]) {
    for (const fragment of fragments) {
        if (!fragment.isComponent) {
            yield ts.createBlock([
                generateFragmentClass(fragment, api),
                asAst(`${comp.name}.${fragment.id}=${fragment.id}`) as ts.Statement
            ]);
        }
    }
}