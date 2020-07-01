import { CompDefinition, findUsedVariables, asAst, cGet, JsxComponent, asCode } from '@tsx-air/compiler-utils';
import { FragmentData } from './jsx.fragment';
import ts, { JsxExpression } from 'typescript';
import { dependantOnVars, setupClosure } from '../helpers';
import { findJsxComp } from '../function';

export const generateVirtualComponents = (fragment: FragmentData) =>
    fragment.root.components.map(generateVCMethod(fragment.comp));

export const getVComp = (comp: CompDefinition, jsxComp: JsxComponent) => {
    const [index] = findJsxComp(comp, jsxComp.sourceAstNode);
    return {
        name: `$${jsxComp.name}${index}`,
        index
    };
};

const generateVCMethod = (comp: CompDefinition) =>
    (jsxComp: JsxComponent) => {
        const mapping = calcRemapping(comp, jsxComp);
        const preMapping = mapping === 'undefined' ? [] : [
            asAst(`const $pr=this.changesBitMap, $ch=${jsxComp.name}.changesBitMap;`) as ts.Statement
        ];
        const { name, index } = getVComp(comp, jsxComp);
        return cGet(name, [
            ...setupClosure(comp, jsxComp.aggregatedVariables),
            ...preMapping,
            ts.createReturn(
                asAst(`VirtualElement.component('${index}', ${jsxComp.name
                    }, this, ${mapping}, ${propsAsObj(jsxComp)})`
                ) as ts.Expression
            )]
        );
    };


function calcRemapping(comp: CompDefinition, jsxComp: JsxComponent) {
    if (comp.name === jsxComp.name) {
        return 'undefined';
    }
    const mapping: string[] = [];
    for (const prop of jsxComp.props) {
        if (ts.isJsxAttribute(prop.sourceAstNode)
            && prop.sourceAstNode.initializer
            && !ts.isLiteralExpression(prop.sourceAstNode.initializer)) {
            const dependencies = dependenciesAsBitMapOr(comp, prop.sourceAstNode.initializer);
            if (dependencies) {
                mapping.push(`[$ch['props.${prop.name}'], ${dependencies}]`);
            }
        }
    }
    return mapping.length ? `new Map([${mapping.join(',')}])` : 'undefined';
}

const propsAsObj = (jsxComp: JsxComponent) => `{${jsxComp.props.map(p => p.name + ':' +
    // @ts-ignore
    ((p.value as JsxExpression)?.expression
        || p.value)).join(',')}}`;

function dependenciesAsBitMapOr(comp: CompDefinition, exp: ts.Expression) {
    const dependencies = dependantOnVars(comp, findUsedVariables(exp));
    const res = [];
    if (dependencies.props) {
        const props = dependencies.props[Object.keys(dependencies.props)[0]];
        // tslint:disable:forin
        for (const prop in props) {
            res.push(`$pr['props.${prop}']`);
        }
    }
    if (dependencies.stores) {
        for (const [store, field] of Object.entries(dependencies.stores)) {
            for (const fieldName in field) {
                res.push(`$pr['${store}.${fieldName}']`);
            }
        }
    }
    return res.join('|');
}
