import { cMethod, asAst, JsxExpression, asCode } from '@tsx-air/compiler-utils';
import { FragmentData } from './jsx.fragment';
import ts from 'typescript';
import { setupClosure } from '../helpers';
import { uniqBy } from 'lodash';
import { tagHandlersUsed } from '../event.handlers';
import { readFuncName } from '../function';
import { prop, propsFromInstance } from './common';

export function generateHydrate(fragment: FragmentData) {

    const bindings: ts.Statement[] = [];

    hydrateExpressions(bindings, fragment);
    hydrateComponents(bindings, fragment);
    hydrateElements(bindings, fragment);

    return cMethod('hydrate', ['_', 't'], [
        ...setupClosure(fragment.comp, bindings, true, 'this.owner'),
        propsFromInstance,
        ...bindings,
        asAst('this.ctx.root=t') as ts.Statement
    ]);
}

const isAttribute = (exp: JsxExpression) => ts.isJsxAttribute(exp.sourceAstNode.parent);

function hydrateExpressions(bindings: ts.Statement[], fragment: FragmentData) {
    const jsxExp = fragment.root.expressions.filter(e => !isAttribute(e));
    const expValues = jsxExp.map(exp => prop(exp.expression));
    if (expValues.length) {
        const values = `[${expValues.join(',')}]`;
        bindings.push(asAst(`this.hydrateExpressions(${values}, t);`) as ts.Statement);
    }
}
function hydrateComponents(bindings: ts.Statement[], fragment: FragmentData) {
    const comps = fragment.root.components.map((c, i) => `this.$${c.name}${i}`);
    if (comps.length) {
        bindings.push(asAst(`this.hydrateComponents([${comps.join(',')}], t);`) as ts.Statement);
    }
}

function hydrateElements(bindings: ts.Statement[], fragment: FragmentData) {
    const dynamicAttributes = fragment.root.expressions.filter(isAttribute);
    if (dynamicAttributes.length) {
        bindings.push(asAst(`this.hydrateElements(t);`) as ts.Statement);

        const jsxElm = (d: JsxExpression) => d.sourceAstNode.parent.parent.parent as ts.JsxOpeningLikeElement;
        const elementsInCtx = uniqBy(dynamicAttributes, jsxElm).map(jsxElm);

        processRefs(bindings, elementsInCtx);
        processHandlers(bindings, fragment, elementsInCtx, jsxElm);
    }
}

function processRefs(bindings: ts.Statement[], elementsInCtx: ts.JsxOpeningLikeElement[]) {
    elementsInCtx.forEach((e, i) => {
        const ref = e.attributes.properties.find(a => asCode(a.name!) === 'ref');
        if (ref) {
            // @ts-ignore
            const targetVar = asCode(ref.initializer.expression);
            bindings.push(asAst(`${targetVar}.element=this.ctx.elements[${i}]`) as ts.Statement);
        }
    });
}

function processHandlers(bindings: ts.Statement[], fragment: FragmentData, elementsInCtx: ts.JsxOpeningLikeElement[], jsxElm: any) {
    for (const [func, attrs] of tagHandlersUsed(fragment)) {
        const handlerName = func.name || readFuncName(func);
        for (const handler of attrs) {
            const elm = elementsInCtx.indexOf(jsxElm(handler));
            if (elm < 0) { throw new Error(`Binding error: missing HTMLElement while adding event listener`); }
            const name = asCode((handler.sourceAstNode.parent as ts.JsxAttribute).name);
            const event = name.replace(/^on/, '').toLowerCase();
            bindings.push(asAst(`this.ctx.elements[${elm}].addEventListener('${event}', this.owner.${handlerName})`) as ts.Statement);
        }
    }
}