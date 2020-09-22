import { cClass, FileTransformerAPI, CompDefinition, asAst } from '@tsx-air/compiler-utils';
import { generateMethods } from './functions/function';
import { generateFragments } from './fragment';
import { parseFragments } from './fragment/jsx.fragment';
import { generateVirtualComponents } from './fragment/virtual.comp';
import ts from 'typescript';

export const generateHookClass = (comp: CompDefinition, api: FileTransformerAPI) => {
    api.swapImport('@tsx-air/framework', '@tsx-air/runtime', ['TSXAir', 'RefHolder']);
    api.ensureImport('getInstance, Component, Fragment, VirtualElement', '@tsx-air/runtime');
    const fragments = [...parseFragments(comp)];
    const hookClass = cClass(
        comp.name!,
        asAst(`Hook`) as ts.Expression,
        undefined,
        true,
        [
            ...generateMethods(comp, fragments),
            ...fragments.filter(f => f.isComponent)
                .map(c => generateVirtualComponents(c, true)[0]),
        ]
    );

    api.appendStatements(...generateFragments(comp, api, fragments));
    return hookClass;
};
