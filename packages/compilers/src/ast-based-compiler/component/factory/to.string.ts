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

export const generateToString = (node: JsxRoot, comp: CompDefinition) => {
    const usedFunctions: ts.Expression[] = [];
    const template = jsxToStringTemplate(node.sourceAstNode, [
        jsxComponentReplacer,
        jsxEventHandlerRemover,
        jsxTextExpressionReplacer(comp, usedFunctions),
        jsxAttributeReplacer,
        jsxAttributeNameReplacer,
        jsxSelfClosingElementReplacer
    ]);

    // TODO fix jsxToStringTemplate
    const usedVars = findUsedVariables(cloneDeep(template));
    const funcs = usedFunctions
        .map(exp => comp.jsxRoots[0].expressions.find(e => e.sourceAstNode === exp))
        .filter(i => i)
        .map(e => usedInScope(comp, e!.aggregatedVariables));
    

    const [propsParam, stateParams, volatileParams] = getGenericMethodParams(comp, usedVars, true, true);
    if (volatileParams === undefined) {
        return cArrow([propsParam, stateParams], template);
    }

    const destructured = [destructureState(comp, usedVars), destructureVolatile(comp, usedVars)].filter(
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

export const jsxTextExpressionReplacer: (
    comp: CompDefinition,
    usedFunctions: ts.Expression[],
) => AstNodeReplacer = (comp, usedFunctions) => node => {
    const swapCalls = (exp:ts.JsxExpression): ts.Expression => {
        const toProto = (n: ts.Node) => {
            const clone = ts.getMutableClone(n);

            if (ts.isCallExpression(n)) {
                const newArgs: ts.Expression[] = [PROPS, STATE, VOLATILE].map(a => ts.createIdentifier(a));
                n.arguments.forEach(a => newArgs.push(cloneDeep(a)));
                usedFunctions.push(n.expression);
                return cCall([comp.name, 'prototype', `_${asCode(n.expression)}`], newArgs);
            }
            clone.forEachChild(toProto);
            return clone;
        };
        return toProto(exp) as ts.Expression;
    };

    if (ts.isJsxExpression(node) && !ts.isJsxAttribute(node.parent)) {
        const expression= node.expression ? swapCalls(node.expression as ts.JsxExpression) : ts.createTrue();

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
