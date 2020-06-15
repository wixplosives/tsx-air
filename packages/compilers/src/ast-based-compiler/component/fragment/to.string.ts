import { setupClosure } from '../helpers';
import {
    jsxToStringTemplate,
    jsxAttributeNameReplacer,
    jsxAttributeReplacer,
    CompDefinition,
    jsxSelfClosingElementReplacer,
    jsxEventHandlerRemover,
    AstNodeReplacer,
    isComponentTag,
    asCode,
    cloneDeep,
    cMethod,
    asAst,
    JsxRoot,
    astTemplate,
} from '@tsx-air/compiler-utils';
import ts from 'typescript';

interface ToStringContext {
    expressions: number;
    components: number;
}

type ReplacerCreator = (x: ToStringContext, comp?: CompDefinition) => AstNodeReplacer;

export const generateToString = (comp: CompDefinition, root: JsxRoot) => {
    const ctx: ToStringContext = {
        expressions: 0,
        components: 0
    };
    for (const r of comp.jsxRoots) {
        if (r === root) {
            break;
        }
        ctx.components += r.components.length;
    }
    const participatingNodes: ts.Node[] = [];
    const template =
        jsxToStringTemplate(root.sourceAstNode, [
            jsxComponentReplacer(ctx),
            jsxEventHandlerRemover,
            jsxTextExpressionReplacer(ctx),
            jsxAttributeReplacer,
            jsxAttributeNameReplacer,
            jsxSelfClosingElementReplacer,
            jsxEmlMarker,
        ].map(r => (n: ts.Node) => {
            const res = r(n);
            if (res) {
                participatingNodes.push(n);
            }
            return res;
        }));

    return cMethod('toString', [], [...setupClosure(comp, participatingNodes),
    ts.createReturn(
        astTemplate(`this.unique(TMPL)`, { TMPL: template }) as any as ts.Expression
    )]);
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
        const comp = asCode(ts.isJsxElement(node) ? node.openingElement.tagName : node.tagName);
        return {
            prefix: '<!--C-->',
            suffix: '<!--C-->',
            expression: asAst(`TSXAir.runtime.toString(this.$${comp}${ctx.components++})`) as ts.Expression
        };
    }
    return false;
};

export const jsxEmlMarker: AstNodeReplacer = node => {
    const withDynamicAttributes = (attributes: ts.JsxAttributes) =>
        attributes.properties.some(p =>
            ts.isJsxAttribute(p) && p.initializer && ts.isJsxExpression(p.initializer));
    const wasNotVisited = (attributes: ts.JsxAttributes) => attributes.properties.every(p => !(ts.isJsxAttribute(p) && asCode(p.name) === 'x-da'));

    return ts.isJsxElement(node) &&
        withDynamicAttributes(node.openingElement.attributes) &&
        wasNotVisited(node.openingElement.attributes) &&
        cloneDeep(ts.createJsxElement(
            ts.createJsxOpeningElement(
                node.openingElement.tagName,
                undefined,
                ts.createJsxAttributes(
                    [...node.openingElement.attributes.properties.map(p => cloneDeep(p)), ts.createJsxAttribute(ts.createIdentifier('x-da'), ts.createStringLiteral('!'))]
                )
            ),
            node.children.map(c => cloneDeep(c)),
            ts.createJsxClosingElement(
                node.openingElement.tagName,
            )
        ), node.parent) as ts.JsxElement;
}

