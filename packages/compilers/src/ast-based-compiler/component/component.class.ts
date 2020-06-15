import { cClass, FileTransformerAPI, CompDefinition, cStatic, astTemplate, cArrow, asAst, asCode } from '@tsx-air/compiler-utils';
import { generatePreRender } from './prerender';
import { generateMethods } from './function';
import { factory } from './factory';
import { generateFragments } from './fragment';
import { parseFragments } from './fragment/jsx.fragment';
import { generateVirtualComponents } from './fragment/virtual.comp';

export const generateComponentClass = (comp: CompDefinition, api: FileTransformerAPI) => {
    const importedComponent = api.ensureImport('Component', '@tsx-air/framework');
    api.ensureImport('VirtualElement', '@tsx-air/framework');
    api.ensureImport('CompFactory', '@tsx-air/framework');
    const fragments = [...parseFragments(comp)];
    const compClass = cClass(
        comp.name!,
        importedComponent,
        undefined,
        true,
        [
            cStatic('factory', factory(comp)),
            ...generateMethods(comp, fragments),
            generatePreRender(comp, fragments),
            ...fragments.filter(f => f.isComponent)
                .map(c => generateVirtualComponents(comp, c)[0]),
        ]
    );

    api.appendStatements(...generateFragments(comp, api, fragments));
    return compClass;
};

