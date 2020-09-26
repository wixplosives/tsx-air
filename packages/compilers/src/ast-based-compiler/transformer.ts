import { TransformerFactoryWithApi } from '@tsx-air/compiler-utils';
import ts, { TransformerFactory } from 'typescript';
import { generateComponentClass } from './component/component.class';
import { generateHookClass } from './component/hook.class';

export const tsxAirValidator: TransformerFactory<ts.SourceFile> =
    ctx => {
        const visitor = (node: ts.Node): any => {
            if (ts.isJsxOpeningLikeElement(node)) {
                throw new Error('Sorry, no JSX outside of TSXAir and Hook');
            }
            return ts.visitEachChild(node, visitor, ctx);
        };
        return visitor as ts.Transformer<ts.SourceFile>;
    };

export const componentTransformer: TransformerFactoryWithApi =
    api => ctx => {
        const visitor = (node: ts.Node): any => {
            if (ts.isVariableStatement(node)) {
                const comps = api().getAnalyzed().compDefinitions;

                const compNode = node.declarationList.declarations[0].initializer!;
                const comp = comps.find(c => c.sourceAstNode === compNode);
                if (comp) {
                    return generateComponentClass(comp, api());
                }
            }
            return ts.visitEachChild(node, visitor, ctx);
        };
        return visitor as ts.Transformer<ts.SourceFile>;
    };

export const hookTransformer: TransformerFactoryWithApi =
    api => ctx => {
        const visitor = (node: ts.Node): any => {
            if (ts.isVariableStatement(node)) {
                const { hooks } = api().getAnalyzed();

                const hookNode = node.declarationList.declarations[0].initializer!;
                const hook = hooks.find(c => c.sourceAstNode === hookNode);
                if (hook) {
                    return generateHookClass(hook, api());
                }
            }
            return ts.visitEachChild(node, visitor, ctx);
        };
        return visitor as ts.Transformer<ts.SourceFile>;
    };