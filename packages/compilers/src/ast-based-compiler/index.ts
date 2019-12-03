import ts from 'typescript';
import { cObject, generateHydrate, cClass, createChangeBitMask, cArrow } from '@wixc3/tsx-air-compiler-utils/src/transformers/generators/ast-generators';
import { transfromerApiProvider, getFileTransformationAPI } from '@wixc3/tsx-air-compiler-utils/src/transformers/generators/transformer-api-provider';
import { generateToString } from '@wixc3/tsx-air-compiler-utils/src/transformers/generators/to-string-generator';
import { printAST } from '@wixc3/tsx-air-compiler-utils/src/dev-utils/print-ast';
import { generateDomBindings } from '@wixc3/tsx-air-compiler-utils/src/transformers/generators/component-common';
import { createProccessUpdateForComp } from './generate-process-update';
import { NamedCompiler } from '../types';

if (typeof window !== 'undefined') {
    (window as any).printAST = printAST;
}


export const tsxAirTransformer: ts.TransformerFactory<ts.Node> = ctx => {
    const visitor: ts.Transformer<ts.Node> = node => {
        if (ts.isVariableStatement(node)) {
            const api = getFileTransformationAPI(node.getSourceFile());
            const comps = api.getAnalayzed().compDefinitions;

            const compNode = node.declarationList.declarations[0].initializer!;
            const comp = comps.find(c => c.sourceAstNode === compNode);
            if (comp) {
                const importedComponent = api.ensureImport('Component', '../../framework/types/component');
                const binding = generateDomBindings(comp);
                const info = comp.jsxRoots[0];
                const res = cClass(
                    comp.name!,
                    importedComponent,
                    undefined,
                    [{
                        isPublic: true,
                        isStatic: true,
                        name: 'factory',
                        initializer: cObject(
                            {
                                toString: generateToString(info, comp),
                                hydrate: generateHydrate(info, comp, binding),
                                initialState: cArrow([], cObject({}))
                            })
                    },
                    {
                        isPublic: true,
                        isStatic: true,
                        name: 'changeBitmask',
                        initializer: createChangeBitMask(comp.usedProps.map(prop => prop.name))
                    },
                    {
                        isPublic: true,
                        isStatic: false,
                        name: '$$processUpdate',
                        initializer: createProccessUpdateForComp(comp, binding)
                    }]);
                return res;
            }
        }


        return ts.visitEachChild(node, visitor, ctx);
    };
    return visitor;
};

const compiler: NamedCompiler = {
    name: 'AST Based compiler',
    transformers: {
        before: [transfromerApiProvider(tsxAirTransformer)]
    }
};

export default compiler;