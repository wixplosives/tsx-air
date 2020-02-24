import ts from 'typescript';
import { getFileTransformationAPI } from '@tsx-air/compiler-utils';
import { generateComponentClass } from './component/component.class';

export const componentTransformer: ts.TransformerFactory<ts.Node> = ctx => {
    const visitor: ts.Transformer<ts.Node> = node => {
        if (ts.isVariableStatement(node)) {
            const api = getFileTransformationAPI(node.getSourceFile());
            const comps = api.getAnalyzed().compDefinitions;

            const compNode = node.declarationList.declarations[0].initializer!;
            const comp = comps.find(c => c.sourceAstNode === compNode);
            if (comp) {
                return generateComponentClass(comp, api);
            }
        }
        return ts.visitEachChild(node, visitor, ctx);
    };
    return visitor;
};
