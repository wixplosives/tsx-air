import { dependantOnVars, getChangeBitsNames, setupClosure } from './helpers';
import ts from 'typescript';
import {
    CompDefinition,
    JsxExpression,
    asCode,
    cMethod,
    asAst,
    JsxComponent,
} from '@tsx-air/compiler-utils';
import { FragmentData } from './fragment/jsx.fragment';
import { getVComp } from './fragment/virtual.comp';

export function* generateUpdateView(comp: CompDefinition, fragment: FragmentData) {
    const statements: ts.Statement[] = [];
    generateExpUpdates(comp, fragment, statements);
    if (statements.length) {
        yield cMethod('updateView', ['$ch'], [
            ...setupClosure(comp, fragment.root.aggregatedVariables),
            asAst(`const $b=this.changesBitMap;`) as ts.Statement,
            ...statements])
    }
};


function generateExpUpdates(comp: CompDefinition, fragment: FragmentData, statements: ts.Statement[]) {
    const addUpdate = (exp: JsxExpression | JsxComponent, setStatement: string) => {
        const dependencies = dependantOnVars(comp, exp.aggregatedVariables);
        const depBits = getChangeBitsNames(dependencies);
        if (depBits.length) {
            const bits = depBits.map(d => `$b['${d}']`);
            statements.push(
                ts.createIf(asAst(`$ch & (${bits.join('|')})`) as ts.Expression,
                    asAst(setStatement) as ts.Statement
                ))
        }
    };
    jsxExp(fragment).forEach((exp, i) =>
        addUpdate(exp, `TSXAir.runtime.updateExpression(this.ctx.expressions[${i}], ${exp.expression})`)
    );
    fragment.root.components.forEach((childComp) =>
        addUpdate(childComp, `TSXAir.runtime.getUpdatedInstance(this.${
            getVComp(comp, childComp).name}.withChanges($ch))`)
    );
    for (const [exp, elmIndex] of dynamicAttrs(fragment)) {
        const attr = exp.sourceAstNode.parent as ts.JsxAttribute;
        const name = asCode(attr.name);
        if (!name.startsWith('on')) {
            addUpdate(exp, `this.ctx.elements[${elmIndex}].setAttribute('${name}', ${exp.expression});`)
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
}
