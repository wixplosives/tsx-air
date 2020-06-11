import { CompDefinition, cMethod, asAst, JsxExpression } from "@tsx-air/compiler-utils";
import { FragmentData } from "./jsx.fragment";
import ts from "typescript";
import { setupClosure } from "../helpers";

export function generateHydrate(comp: CompDefinition, fragment: FragmentData) {
    const isAttribute = (exp: JsxExpression) =>
        ts.isJsxAttribute(exp.sourceAstNode.parent);
    const jsxExp = fragment.root.expressions.filter(e => !isAttribute(e));
    const dynamicAttributes =  fragment.root.expressions.filter(isAttribute)
    const expValues = jsxExp.map(exp => exp.expression);
    const comps = fragment.root.components.map((_, i) => `this.$comp${i}()`);
    const dependencies = [
        ...fragment.root.expressions.map(exp => exp.sourceAstNode),
        ...fragment.root.components.map(c => c.sourceAstNode)];
    const bindings:ts.Statement[] = [];
    if (expValues.length) {
        bindings.push(asAst(`this.hydrateExpressions([${expValues.join()}], t);`) as ts.Statement);
    }
    if (comps.length) {
        bindings.push(asAst(`this.hydrateComponents([${comps.join(',')}], t);`) as ts.Statement);
    }
    if (dynamicAttributes.length) {
        bindings.push(asAst(`this.hydrateElements(t);`) as ts.Statement)
    }
   
    return cMethod('hydrate', ['_', 't'], [
        ...setupClosure(comp, dependencies),
        ...bindings,
        asAst('this.ctx.root=t') as ts.Statement
    ]);
}