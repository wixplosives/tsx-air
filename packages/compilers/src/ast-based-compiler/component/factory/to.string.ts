import { addToClosure, getDirectDependencies } from '../helpers';
import {
    jsxToStringTemplate,
    jsxAttributeNameReplacer,
    jsxAttributeReplacer,
    CompDefinition,
    jsxSelfClosingElementReplacer,
    jsxEventHandlerRemover,
    findUsedVariables,
    AstNodeReplacer,
    isComponentTag,
    asCode,
    cloneDeep,
    cMethod,
    asAst,
    UsedVariables,
    JsxRoot,
} from '@tsx-air/compiler-utils';
import ts from 'typescript';
import { merge } from 'lodash';

interface ToStringContext {
    executedFuncs: string[];
    expressions: number;
    components: number;
    usedVars: UsedVariables;
}

type ReplacerCreator = (x: ToStringContext, comp?: CompDefinition) => AstNodeReplacer;

export const generateToString = (comp: CompDefinition, root:JsxRoot) => {
    const ctx: ToStringContext = {
        executedFuncs: [],
        expressions: 0,
        components: 0,
        usedVars: {
            read: {}, accessed: {}, defined: {}, executed: {}, modified: {}
        }
    }
    const template =
        jsxToStringTemplate(root.sourceAstNode, [
            jsxComponentReplacer(ctx),
            jsxEventHandlerRemover,
            jsxTextExpressionReplacer(ctx),
            jsxAttributeReplacer,
            jsxAttributeNameReplacer,
            jsxSelfClosingElementReplacer
        ].map(r => (n: ts.Node) => {
            const res = r(n);
            if (res) {
                const u = findUsedVariables(n);
                ctx.usedVars = merge(ctx.usedVars, u);
            }
            return res;
        }));

    const usedVars = getDirectDependencies(comp, ctx.usedVars, true);
    const methods = Object.keys(ctx.usedVars.executed).filter(
        name => comp.functions.some(fn => fn.name === name)
    );
    return cMethod('toString', [], [...addToClosure(usedVars), ...addToClosure(methods), ts.createReturn(template)]);
};

const toStringAstTemplate = asAst(`TSXAir.runtime.toString(EXP)`);
const tsxAirToString = (exp: ts.Node) =>
    cloneDeep(toStringAstTemplate, undefined, (n: ts.Node) => {
        if (ts.isIdentifier(n) && asCode(n) === 'EXP') {
            return exp as ts.Expression;
        }
        return undefined;
    }) as ts.Expression;


export const jsxTextExpressionReplacer: ReplacerCreator =
    ctx => node => {
        if (ts.isJsxExpression(node) && !ts.isJsxAttribute(node.parent)) {
            const exp = node.expression ? node.expression as ts.JsxExpression : asAst(`''`);
            ctx.expressions++;
            return {
                prefix: `<!--X-->`,
                suffix: `<!--X-->`,
                expression: tsxAirToString(exp)
            }
        } else {
            return false;
        }
    };

export const jsxComponentReplacer: ReplacerCreator = ctx => node => {
    if (
        (ts.isJsxElement(node) && isComponentTag(node.openingElement.tagName)) ||
        (ts.isJsxSelfClosingElement(node) && isComponentTag(node.tagName))
    ) {
        return {
            prefix: '<!--C-->',
            suffix: '<!--C-->',
            expression: asAst(`TSXAir.runtime.toString(this.$comp${ctx.components++}())`) as ts.Expression
        };
    }
    return false;
};

// export const jsxComponentReplacer: ReplacerCreator = ctx => node => {
    // if (
    //     (ts.isJsxElement(node) && isComponentTag(node.openingElement.tagName)) ||
    //     (ts.isJsxSelfClosingElement(node) && isComponentTag(node.tagName))
    // ) {
    //     const openingNode = ts.isJsxElement(node) ? node.openingElement : node;
    //     const tagName = asCode(openingNode.tagName);
    //     // const props = getCompProps(openingNode.attributes.properties);
    //     // const mapping = getPropsMapping(comp, openingNode.attributes.properties);
    //     ctx.components++;

    //     return {
    //         prefix: '<!--C-->',
    //         suffix: '<!--C-->',
    //         expression: cCall(
    //             ['this', 'factory', 'toString'],
    //             [cObject(
    //                 openingNode.attributes.properties.reduce((acc, prop) => {
    //                     if (ts.isJsxSpreadAttribute(prop)) {
    //                         throw new Error('spread in attributes is not handled yet');
    //                     }
    //                     const initializer = prop.initializer;
    //                     const name = asCode(prop.name);
    //                     if (!initializer) {
    //                         acc[name] = ts.createTrue();
    //                     } else if (ts.isJsxExpression(initializer)) {
    //                         if (initializer.expression) {
    //                             acc[name] = cloneDeep(initializer.expression);
    //                         }
    //                     } else {
    //                         acc[name] = cloneDeep(initializer);
    //                     }
    //                     return acc;
    //                 }, {} as Record<string, any>)
    //             )]
    //         )
    //     };
    // }
//     return false;
// };
