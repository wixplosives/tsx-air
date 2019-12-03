import ts from 'typescript';
import { createProcessUpdateForComp } from './generate-process-update';
import { NamedCompiler } from '../types';
import { printAST, getFileTransformationAPI, cObject, generateDomBindings, cClass, generateToString, generateHydrate, cArrow, createChangeBitMask, transfromerApiProvider } from '@wixc3/tsx-air-compiler-utils';

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
                const importedComponent = api.ensureImport('Component', '@wixc3/tsx-air-framework');
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
                        initializer: createProcessUpdateForComp(comp, binding)
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