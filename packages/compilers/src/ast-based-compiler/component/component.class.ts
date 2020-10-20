import { cClass, FileTransformerAPI, CompDefinition, asAst, cMethod } from '@tsx-air/compiler-utils';
import { generateMethods } from './functions/function';
import { parseFragments } from './fragment/jsx.fragment';
import { generateVirtualComponents } from './fragment/virtual.comp';
import ts from 'typescript';
import { generateInlineComponents } from './functions/inline.class';
import { generateFragments } from './fragment/fragment.class';

export const generateComponentClass = (comp: CompDefinition, api: FileTransformerAPI) => {
    api.swapImport('@tsx-air/framework', '@tsx-air/runtime', ['TSXAir', 'RefHolder']);
    api.ensureImport('getInstance, Component, VirtualElement', '@tsx-air/runtime');
    const fragments = parseFragments(comp);
    const compClass = cClass(
        comp.name!,
        asAst(`Component`) as ts.Expression,
        undefined,
        true,
        [
            generateRender(comp),
            ...generateMethods(comp, fragments),
            ...fragments.filter(f => f.isComponent)
                .map(c => generateVirtualComponents(c, true)[0]),
        ]
    );

    const subClasses = [
        ...generateFragments(comp, fragments, api),
        ...generateInlineComponents(comp, fragments, api)
    ];
    if (subClasses.length) {
        api.appendStatements(ts.createBlock(subClasses));
    }
    return compClass;
};

function generateRender(comp: CompDefinition) {
    return cMethod('render', ['p', 't', 'a'],
        [asAst(`return Component._render(getInstance(), ${comp.name}, p, t, a);`, true) as ts.Statement], true);
}