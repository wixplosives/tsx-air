import ts from 'typescript';
import { cObject, generateHydrate, cClass } from './ast-generators';
import { GeneratorTransformer } from './append-node-transformer';
import { generateToString } from './to-string-generator';

export const contains = (node: ts.Node, child: ts.Node) => node.getStart() <= child.getStart() && node.getEnd() >= child.getEnd();



export const tsxAirTransformer: GeneratorTransformer = (genCtx, ctx) => {
    const comps = genCtx.getScanRes().compDefinitions;
    const visitor: ts.Transformer<ts.Node> = node => {
        const comp = comps.find(c => c.sourceAstNode === node);
        if (comp) {
            const info = comp.jsxRoots[0];
            return cClass(comp.name || 'untitled', undefined, [
                {
                    isPublic: true,
                    isStatic: true,
                    name: 'factory',
                    initializer: cObject(
                        {
                            toString: generateToString(info, comp),
                            hydrate: generateHydrate(info, comp)
                        })
                }
            ]);
        }
        return ts.visitEachChild(node, visitor, ctx);
    };
    return visitor;
};