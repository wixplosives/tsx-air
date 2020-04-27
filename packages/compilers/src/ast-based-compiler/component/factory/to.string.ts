import { getGenericMethodParams, destructureState, destructureVolatile, usedInScope } from '../helpers';
import {
    cArrow,
    jsxToStringTemplate,
    jsxAttributeNameReplacer,
    jsxAttributeReplacer,
    JsxRoot,
    CompDefinition,
    isComponentTag,
    cCall,
    cObject,
    AstNodeReplacer,
    cloneDeep,
    jsxSelfClosingElementReplacer,
    jsxEventHandlerRemover,
    printAst,
    asCode,
    cConst,
    findUsedVariables
} from '@tsx-air/compiler-utils';
import ts from 'typescript';
import { VOLATILE, STATE, PROPS } from '../../consts';
import { chain } from 'lodash';
import isEqual from 'lodash/isEqual';

export const generateToString = (node: JsxRoot, comp: CompDefinition) => {
    const template = jsxToStringTemplate(node.sourceAstNode, [
        jsxComponentReplacer,
        jsxEventHandlerRemover,
        jsxTextExpressionReplacer(comp),
        jsxAttributeReplacer,
        jsxAttributeNameReplacer,
        jsxSelfClosingElementReplacer
    ]);

    // TODO fix jsxToStringTemplate
    const usedVars = usedInScope(comp, node.aggregatedVariables, true);
    const hasCompMethodCalls = chain(node.aggregatedVariables.executed)
        .values()
        .some(v => isEqual(v, {}))
        .value();
    const [propsParam, stateParams] = getGenericMethodParams(comp, node.aggregatedVariables, true, !hasCompMethodCalls);
    if (!usedVars.volatile && !hasCompMethodCalls) {
        return cArrow([propsParam, stateParams], template);
    }

    const destructured = [destructureState(usedVars), destructureVolatile(usedVars)].filter(
        i => i
    ) as ts.VariableStatement[];
    const volatile = cConst(
        VOLATILE,
        cCall(
            [comp.name!, 'prototype', '$preRender'],
            [ts.createIdentifier(propsParam ? comp.propsIdentifier || PROPS : '__0'), ts.createIdentifier(STATE)]
        )
    );
    return cArrow([propsParam, stateParams && STATE], [volatile, ...destructured, ts.createReturn(template)]);
};

export const jsxTextExpressionReplacer: (comp: CompDefinition) => AstNodeReplacer = comp => node => {
    const swapCalls = (exp: ts.JsxExpression): ts.Expression => {
        const toProto = (n: ts.Node) => {
            const clone = ts.getMutableClone(n);

            if (ts.isCallExpression(n)) {
                const args: Array<ts.Identifier | ts.Expression> = getGenericMethodParams(
                    comp,
                    findUsedVariables(n),
                    true,
                    false
                ).map(u => (u ? ts.createIdentifier(u as string) : ts.createIdentifier('undefined')));
                n.arguments.forEach(a => args.push(cloneDeep(a)));
                return cCall([comp.name, 'prototype', `_${asCode(n.expression)}`], args);
            }
            clone.forEachChild(toProto);
            return clone;
        };
        return toProto(exp) as ts.Expression;
    };

    if (ts.isJsxExpression(node) && !ts.isJsxAttribute(node.parent)) {
        const expression = node.expression ? swapCalls(node.expression as ts.JsxExpression) : ts.createTrue();

        return {
            prefix: `<!-- ${node.expression ? asCode(node.expression) : 'empty expression'} -->`,
            expression,
            suffix: `<!-- -->`
        };
    } else {
        return false;
    }
};

export const jsxComponentReplacer: AstNodeReplacer = node => {
    if (
        (ts.isJsxElement(node) && isComponentTag(node.openingElement.tagName)) ||
        (ts.isJsxSelfClosingElement(node) && isComponentTag(node.tagName))
    ) {
        const openingNode = ts.isJsxElement(node) ? node.openingElement : node;
        const tagName = printAst(openingNode.tagName);

        return {
            expression: cCall(
                [tagName, 'factory', 'toString'],
                [
                    cObject(
                        openingNode.attributes.properties.reduce((accum, prop) => {
                            if (ts.isJsxSpreadAttribute(prop)) {
                                throw new Error('spread in attributes is not handled yet');
                            }
                            const initializer = prop.initializer;
                            const name = printAst(prop.name);
                            if (!initializer) {
                                accum[name] = ts.createTrue();
                            } else if (ts.isJsxExpression(initializer)) {
                                if (initializer.expression) {
                                    accum[name] = cloneDeep(initializer.expression);
                                }
                            } else {
                                accum[name] = cloneDeep(initializer);
                            }
                            return accum;
                        }, {} as Record<string, any>)
                    )
                ]
            )
        };
    }
    return false;
};
