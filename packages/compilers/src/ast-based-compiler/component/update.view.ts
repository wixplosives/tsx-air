import { dependantOnVars, setupClosure } from './helpers';
import ts from 'typescript';
import {
    JsxExpression,
    asCode,
    cMethod,
    asAst,
    JsxComponent,
} from '@tsx-air/compiler-utils';
import { FragmentData } from './fragment/jsx.fragment';
import { getVComp } from './fragment/virtual.comp';
import { toFragSafe } from './function';

export function* generateUpdateView(fragment: FragmentData) {
    const { comp } = fragment;
    const statements: ts.Statement[] = [];
    generateExpUpdates(statements, fragment);
    if (statements.length) {
        yield cMethod('updateView', [], [
            ...setupClosure(comp, fragment.root.aggregatedVariables),
            ...statements]);
    }
}

function generateExpUpdates(statements: ts.Statement[],  fragment: FragmentData) {
    const { comp, allFragments: fragments } = fragment;
    const addUpdate = (exp: JsxExpression | JsxComponent, setStatement: string) => {
        const dependencies = dependantOnVars(comp, exp.aggregatedVariables);
        if (dependencies.stores) {
            const stores = Object.keys(dependencies.stores);
            const conditions: string[] = [];
            for (const storeName of stores) {
                const bits = Object.keys(dependencies.stores[storeName]).map(d => `${storeName}.$bits['${d}']`);
                conditions.push(`(this.modified.get(${storeName}) & (${bits.join('|')}))`);
            }
            statements.push(
                ts.createIf(asAst(conditions.join('||')) as ts.Expression,
                    asAst(setStatement) as ts.Statement
                ));
        }
    };
    jsxExp(fragment).forEach((exp, i) =>
        addUpdate(exp, `$rt().updateExpression(this.ctx.expressions[${i}], ${asCode(toFragSafe(comp, fragments, exp))})`)
    );
    fragment.root.components.forEach(childComp =>
        addUpdate(childComp, `$rt().getUpdatedInstance(this.${
            getVComp(comp, childComp).name})`)
    );
    for (const [exp, elmIndex] of dynamicAttrs(fragment)) {
        const attr = exp.sourceAstNode.parent as ts.JsxAttribute;
        const name = asCode(attr.name);
        if (!name.startsWith('on')) {
            let attrValue = exp.expression;
            if (name === 'style') {
                attrValue = `$rt().spreadStyle(${attrValue})`;
            }
            addUpdate(exp, `this.ctx.elements[${elmIndex}].setAttribute('${name}', ${attrValue});`);
        }
    }
}

const isAttribute = (exp: JsxExpression) =>
    ts.isJsxAttribute(exp.sourceAstNode.parent);

const jsxExp = (fragment: FragmentData) => fragment.root.expressions.filter(e => !isAttribute(e));
const dynamicAttrs = (fragment: FragmentData) => {
    const elms = new Set();
    const map = new Map<JsxExpression, number>();
    fragment.root.expressions
        .filter(e => isAttribute(e))
        .forEach(a => {
            elms.add(a.sourceAstNode.parent.parent.parent);
            map.set(a, elms.size - 1);
        });
    return map;
};
