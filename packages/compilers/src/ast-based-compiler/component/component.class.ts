import { cClass, FileTransformerAPI, CompDefinition, asAst } from '@tsx-air/compiler-utils';
import { generateMethods } from './function';
import { generateFragments } from './fragment';
import { parseFragments } from './fragment/jsx.fragment';
import { generateVirtualComponents } from './fragment/virtual.comp';
import ts from 'typescript';

export const generateComponentClass = (comp: CompDefinition, api: FileTransformerAPI) => {
    api.removeImport('@tsx-air/framework');
    api.ensureImport('getInstance, when, store, Component, Fragment, VirtualElement', '@tsx-air/runtime');
    const fragments = [...parseFragments(comp)];
    const compClass = cClass(
        comp.name!,
        asAst(`Component`) as ts.Expression,
        undefined,
        true,
        [
            ...generateMethods(comp, fragments),
            ...fragments.filter(f => f.isComponent)
                .map(c => generateVirtualComponents(c, true)[0]),
        ]
    );

    api.appendStatements(...generateFragments(comp, api, fragments));
    return compClass;
};

