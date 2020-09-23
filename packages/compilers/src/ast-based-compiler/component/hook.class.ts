import { cClass, FileTransformerAPI, CompDefinition, asAst, HookDefinition } from '@tsx-air/compiler-utils';
import { generateMethods } from './functions/function';
import { generateFragments } from './fragment';
import { parseFragments } from './fragment/jsx.fragment';
import { generateVirtualComponents } from './fragment/virtual.comp';
import ts from 'typescript';

export const generateHookClass = (hook: HookDefinition, api: FileTransformerAPI) => {
    api.swapImport('@tsx-air/framework', '@tsx-air/runtime', ['TSXAir', 'RefHolder']);
    api.ensureImport('getInstance, Component, Fragment, VirtualElement', '@tsx-air/runtime');
    const hookClass = cClass(
        hook.name!,
        asAst(`Hook`) as ts.Expression,
        undefined,
        true,
        [
            // ...generateMethods(hook, fragments),
            // ...fragments.filter(f => f.isComponent)
            //     .map(c => generateVirtualComponents(c, true)[0]),
        ]
    );

    // api.appendStatements(...generateFragments(hook, api, fragments));
    return hookClass;
};
