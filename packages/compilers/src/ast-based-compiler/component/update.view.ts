import ts from 'typescript';
import {
    JsxExpression, asCode, cMethod, asAst, JsxComponent, isJsxComponent
} from '@tsx-air/compiler-utils';
import { FragmentData } from './fragment/jsx.fragment';
import { getVComp } from './fragment/virtual.comp';
import { propsAndRtFromInstance, prop, toCanonicalString } from './fragment/common';
import { jsxExp, dynamicAttributes, attrElement } from './helpers';

export function* generateUpdateView(fragment: FragmentData) {
    const statements: ts.Statement[] = [];
    generateExpUpdates(statements, fragment);
    if (statements.length) {
        yield cMethod('updateView', [], [
            propsAndRtFromInstance,
            asAst(`const {$bits}=$props;`) as ts.Statement,
            asAst(`const $mod=this.modified.get($props)||0;`) as ts.Statement,
            ...statements]);
    }
}

function generateExpUpdates(statements: ts.Statement[], fragment: FragmentData) {
    const { comp } = fragment;
    const addUpdate = (exp: JsxExpression | JsxComponent, setStatement: string) => {
        if (!isJsxComponent(exp)) {
            statements.push(
                ts.createIf(asAst(`($mod & $bits[${toCanonicalString(exp.expression)}])`) as ts.Expression,
                    asAst(setStatement) as ts.Statement
                ));
        }
    };
    jsxExp(fragment).forEach((exp, i) =>
        addUpdate(exp, `$rt.updateExpression(this.ctx.expressions[${i}], ${prop(exp.expression)})`)
    );
    fragment.root.components.forEach(childComp =>
        statements.push(asAst(`$rt.getUpdatedInstance(this.${
            getVComp(comp, childComp).name})`) as ts.Statement)
    );
    for (const [exp, elmIndex] of elementsWithDynamicAttr(fragment)) {
        const attr = exp.sourceAstNode.parent as ts.JsxAttribute;
        const name = asCode(attr.name);
        if (!name.startsWith('on')) {
            let attrValue = prop(exp.expression);
            if (name === 'style') {
                attrValue = `$rt.spreadStyle(${attrValue})`;
            }
            addUpdate(exp, `this.ctx.elements[${elmIndex}].setAttribute('${name}', ${attrValue});`);
        }
    }
}

const elementsWithDynamicAttr = (fragment: FragmentData) => {
    const elms = new Set();
    const map = new Map<JsxExpression, number>();
    dynamicAttributes(fragment)
        .forEach(a => {
            elms.add(attrElement(a));
            map.set(a, elms.size - 1);
        });
    return map;
};

