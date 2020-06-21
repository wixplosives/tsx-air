import { setupClosure } from '../helpers';
import {
    jsxToStringTemplate,
    cMethod,
    astTemplate,
    asCode,
} from '@tsx-air/compiler-utils';
import ts from 'typescript';
import { swapVirtualElements } from '../function';
import { FragmentData } from './jsx.fragment';
import { isUndefined, cloneDeep } from 'lodash';


export const generateToString = (fragment: FragmentData) => {
    const { comp, allFragments: fragments, root } = fragment;

    const template =
        jsxToStringTemplate(root.sourceAstNode, [
            n => n !== root.sourceAstNode
                ? swapVirtualElements(comp, fragments, n, true)
                : undefined
            n => {
                if (ts.isJsxAttributes(n) && n.properties.some(
                    a => ts.isJsxAttribute(a)
                        && a.initializer && ts.isJsxExpression(a.initializer))) {
                    return ts.createJsxAttributes([...n.properties.map(p => cloneDeep(p)),
                    ts.createJsxAttribute(ts.createIdentifier('x-da'), ts.createStringLiteral('!'))])
                }
            }
        ])

    return cMethod('toString', [], [
        ...setupClosure(comp, root.aggregatedVariables),
        ts.createReturn(
            astTemplate(`this.unique(TMPL)`, { TMPL: template }) as any as ts.Expression
        )]);
};

