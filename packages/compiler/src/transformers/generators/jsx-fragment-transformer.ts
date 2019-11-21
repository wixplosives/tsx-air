import ts from 'typescript';
import { cObject, cCall, generateHydrate } from './ast-generators';
import { GeneratorTransformer } from './append-node-transformer';
import { isJsxRoot } from '../../analyzers/types';
import { generateToString } from './to-string-generator';
import { generateDomBindings } from './component-common';

export const contains = (node: ts.Node, child: ts.Node) => node.getStart() <= child.getStart() && node.getEnd() >= child.getEnd();



export const fragmentTransformer: GeneratorTransformer = (genCtx, ctx) => {
    const visitor: ts.Transformer<ts.Node> = node => {
        if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
            const rootInfo = genCtx.getNodeInfo(node);
            const scan = genCtx.getScanRes();
            if (!rootInfo) {
                throw new Error('fragment info not found');
            }
            const parentComp = scan.compDefinitions.find(comp => contains(comp.sourceAstNode, node))!;
            const bindings = generateDomBindings(parentComp);
            const info = rootInfo[0];
            const ref = isJsxRoot(info) ? genCtx.appendPrivateVar(parentComp.name + '_untitled', cObject(
                {
                    toString: generateToString(info, parentComp),
                    hydrate: generateHydrate(info, parentComp, bindings)
                })) : ts.createIdentifier(info.name);


            return cCall(['TSXAir', 'createElement'], [ref, cObject({})]);

        }
        return ts.visitEachChild(node, visitor, ctx);
    };
    return visitor;
};