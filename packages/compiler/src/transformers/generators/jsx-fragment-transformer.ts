import ts from 'typescript';
import { cObject, jsxToStringTemplate, jsxComponentReplacer, jsxTextExpressionReplacer, jsxAttributeReplacer, cArrow, cCall } from './ast-generators';
import { GeneratorTransformer } from './append-node-transformer';


export const fragmentTransformer: GeneratorTransformer = (genCtx, ctx) => {
    const visitor: ts.Transformer<ts.Node> = node => {
        if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
            const fragmentRef = genCtx.appendPrivateVar('gaga', cObject(
                {
                    toString: cArrow(jsxToStringTemplate(node, [
                        jsxComponentReplacer,
                        jsxTextExpressionReplacer,
                        jsxAttributeReplacer
                    ]), 'props')
                }));
            return cCall(['TSXAir', 'createElement'], [fragmentRef, cObject({})]);
        }
        return ts.visitEachChild(node, visitor, ctx);
    };
    return visitor;
};