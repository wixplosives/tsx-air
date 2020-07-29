import { CompDefinition, asAst, cGet, JsxComponent, isJsxExpression } from '@tsx-air/compiler-utils';
import { FragmentData } from './jsx.fragment';
import ts from 'typescript';
import { setupClosure } from '../helpers';
import { findJsxComp } from '../function';
import {  prop, propsFromInstance } from './common';

export const generateVirtualComponents = (fragment: FragmentData, componentMode: boolean) =>
    fragment.root.components.map(generateVCMethod(fragment.comp, componentMode));

export const getVComp = (comp: CompDefinition, jsxComp: JsxComponent) => {
    const [index] = findJsxComp(comp, jsxComp.sourceAstNode);
    return {
        name: `$${jsxComp.name}${index}`,
        index
    };
};

const generateVCMethod = (comp: CompDefinition, componentMode: boolean) =>
    (jsxComp: JsxComponent) => {
        const { name, index } = getVComp(comp, jsxComp);
        
        return cGet(name, [
            ...(componentMode
                ? setupClosure(comp, jsxComp.aggregatedVariables)
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