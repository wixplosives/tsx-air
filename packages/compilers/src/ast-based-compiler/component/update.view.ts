import { dependantOnVars, getChangeBitsNames, setupClosure } from './helpers';
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
        yield cMethod('updateView', ['$ch'], [
            ...setupClosure(comp, fragment.root.aggregatedVariables),
            asAst(`const $b=this.changesBitMap;`) as ts.Statement,
            ...statements]);
    }
}

function generateExpUpdates(statements: ts.Statement[], fragment: FragmentData) {
    const { comp, allFragments: fragments } = fragment;
    const addUpdate = (exp: JsxExpression | JsxComponent, setStatement: string) => {
        const dependencies = dependantOnVars(comp, exp.aggregatedVariables);
        const depBits = getChangeBitsNames(dependencies);
        if (depBits.length) {
            const bits = depBits.map(d => `$b['${d}']`);
            statements.push(
                ts.createIf(asAst(`$ch & (${bits.join('|')})`) as ts.Expression,
                    asAst(setStatement) as ts.Statement
                ));
        }
    };
    jsxExp(fragment).forEach((exp, i) =>
        addUpdate(exp, `TSXAir.runtime.updateExpression(this.ctx.expressions[${i}], ${asCode(toFragSafe(comp, fragments, exp))})`)
    );
    fragment.root.components.forEach(childComp =>
        addUpdate(childComp, `TSXAir.runtime.getUpdatedInstance(this.${
            getVComp(comp, childComp).name}.withChanges($ch))`)
    );
    for (const [exp, elmIndex] of dynamicAttrs(fragment)) {
        const attr = exp.sourceAstNode.parent as ts.JsxAttribute;
        const name = asCode(attr.name);
        if (!name.startsWith('on')) {
            let attrValue = exp.expression;
            if (name === 'style') {
                attrValue = `TSXAir.runtime.spreadStyle(${attrValue})`;
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
