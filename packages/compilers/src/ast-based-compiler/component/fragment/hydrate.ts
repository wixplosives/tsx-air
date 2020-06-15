import { CompDefinition, cMethod, asAst, JsxExpression, asCode } from "@tsx-air/compiler-utils";
import { FragmentData } from "./jsx.fragment";
import ts from "typescript";
import { setupClosure } from "../helpers";
import { uniqBy } from "lodash";
import { tagHandlersUsed } from "../event.handlers";
import { readFuncName } from "../function";

export function generateHydrate(comp: CompDefinition, fragment: FragmentData) {
    const isAttribute = (exp: JsxExpression) =>
        ts.isJsxAttribute(exp.sourceAstNode.parent);

    const jsxExp = fragment.root.expressions.filter(e => !isAttribute(e));
    const dynamicAttributes = fragment.root.expressions.filter(isAttribute)
    const expValues = jsxExp.map(exp => exp.expression);
    const comps = fragment.root.components.map((c, i) => `this.$${c.name}${i}`);
    const dependencies = [
        ...fragment.root.expressions.map(exp => exp.sourceAstNode),
        ...fragment.root.components.map(c => c.sourceAstNode)];
    const bindings: ts.Statement[] = [];
    if (expValues.length) {
        bindings.push(asAst(`this.hydrateExpressions([${expValues.join()}], t);`) as ts.Statement);
    }
    if (comps.length) {
        bindings.push(asAst(`this.hydrateComponents([${comps.join(',')}], t);`) as ts.Statement);
    }
    if (dynamicAttributes.length) {
        bindings.push(asAst(`this.hydrateElements(t);`) as ts.Statement)
        const jsxElm = (d: JsxExpression) => d.sourceAstNode.parent.parent.parent as ts.JsxOpeningLikeElement;
        const elementsInCtx = uniqBy(dynamicAttributes, jsxElm).map(jsxElm);
        for (const [func, attrs] of tagHandlersUsed(comp, fragment)) {
            const handlerName = func.name || readFuncName(func);
            for (const handler of attrs) {
                const elm = elementsInCtx.indexOf(jsxElm(handler));
                if (elm < 0) throw new Error(`Binding error: missing HTMLElement while adding event listener`);
                const name = asCode((handler.sourceAstNode.parent as ts.JsxAttribute).name);
                const event = name.replace(/^on/, '').toLowerCase();
                bindings.push(asAst(`this.ctx.elements[${elm}].addEventListener('${event}', this.owner.${handlerName})`) as ts.Statement);
            }
        }
    }

    return cMethod('hydrate', ['_', 't'], [
        ...setupClosure(comp, dependencies),
        ...bindings,
        asAst('this.ctx.root=t') as ts.Statement
    ]);
}