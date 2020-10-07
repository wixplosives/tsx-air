import { asAst, cGet, JsxComponent, isJsxExpression, getNodeSrc, UserCode } from '@tsx-air/compiler-utils';
import { FragmentData } from './jsx.fragment';
import ts from 'typescript';
import { setupClosure } from '../helpers';
import { prop, propsFromInstance } from './common';

export const generateVirtualComponents = (fragment: FragmentData, componentMode: boolean) =>
    fragment.root.components.map(generateVCMethod(fragment.code, componentMode));

export const getVComp = (code: UserCode, jsxComp: JsxComponent) => {
    const [index] = findJsxComp(code, jsxComp.sourceAstNode);
    return {
        name: `$${jsxComp.name}${index}`,
        index
    };
};

export const findJsxComp = (code: UserCode, node: ts.Node): [-1, null] | [number, JsxComponent] => {
    let compIndex = 0;
    for (const root of code.jsxRoots) {
        for (const c of root.components) {
            if (c.sourceAstNode === getNodeSrc(node)) {
                return [compIndex, c];
            }
            compIndex++;
        }
    }
    return [-1, null];
};

const generateVCMethod = (code: UserCode, componentMode: boolean) =>
    (jsxComp: JsxComponent) => {
        const { name, index } = getVComp(code, jsxComp);

        return cGet(name, [
            ...(componentMode
                ? setupClosure(code, jsxComp.aggregatedVariables)
                : [propsFromInstance]),
            ts.createReturn(
                asAst(`VirtualElement.component('${index}', ${jsxComp.name
                    }, this, ${propsAsObj(jsxComp, componentMode)})`
                ) as ts.Expression
            )]
        );
    };

const propsAsObj = (jsxComp: JsxComponent, componentMode: boolean) => `{${jsxComp.props.map(p => {
    const val = (isJsxExpression(p.value) ? p.value.expression : p.value) as string;
    return `${p.name} : ${componentMode ? val : prop(val)}`;
}).join(',')}}`;