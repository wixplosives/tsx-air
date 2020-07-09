import { CompDefinition, asAst, cGet, JsxComponent } from '@tsx-air/compiler-utils';
import { FragmentData } from './jsx.fragment';
import ts, { JsxExpression } from 'typescript';
import { setupClosure } from '../helpers';
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
        const { name, index } = getVComp(comp, jsxComp);
        return cGet(name, [
            ...setupClosure(comp, jsxComp.aggregatedVariables),
            ts.createReturn(
                asAst(`VirtualElement.component('${index}', ${jsxComp.name
                    }, this, ${propsAsObj(jsxComp)})`
                ) as ts.Expression
            )]
        );
    };

const propsAsObj = (jsxComp: JsxComponent) => `{${jsxComp.props.map(p => p.name + ':' +
    // @ts-ignore
    ((p.value as JsxExpression)?.expression
        || p.value)).join(',')}}`;
