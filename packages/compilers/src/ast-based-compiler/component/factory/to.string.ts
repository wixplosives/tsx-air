import { getGenericMethodParams, destructureStateAndVolatile } from '../helpers';
import {
    cArrow, jsxToStringTemplate, jsxAttributeNameReplacer, jsxAttributeReplacer,
    JsxRoot, CompDefinition, isComponentTag, cCall, cObject, AstNodeReplacer, cloneDeep,
    jsxSelfClosingElementReplacer, jsxEventHandlerRemover, printAst,
    printAstText, cConst, findUsedVariables
} from '@tsx-air/compiler-utils';
import ts from 'typescript';

export const generateToString = (node: JsxRoot, comp: CompDefinition) => {
    const template = jsxToStringTemplate(node.sourceAstNode, [
        jsxComponentReplacer,
        jsxEventHandlerRemover,
        jsxTextExpressionReplacer(comp),
        jsxAttributeReplacer,
        jsxAttributeNameReplacer,
        jsxSelfClosingElementReplacer,
    ]);

    const usedVars = findUsedVariables(template);
    const params = getGenericMethodParams(comp, usedVars, true, true);
    if (params[2] === undefined) {
        return cArrow(params, template);
    } else {
        params.pop();
    }

    const destructured = destructureStateAndVolatile(comp, usedVars);
    const volatile = cConst('volatile', cCall([comp.name!, '$preRender'], [
        ts.createIdentifier(comp.propsIdentifier || 'props'),
        ts.createIdentifier('state')
    ]));
    params[1] = params[1] && 'state';
    return cArrow(params, [
        volatile,
        ...destructured,
        ts.createReturn(template)]);
};

export const jsxTextExpressionReplacer: (comp: CompDefinition) => AstNodeReplacer =
    comp => node => ts.isJsxExpression(node) &&
        !ts.isJsxAttribute(node.parent) &&
    {
        prefix: `<!-- ${node.expression ? printAst(node.expression) : 'empty expression'} -->`,
        expression: node.expression ? swapCalls(node.expression, comp) : ts.createTrue(),
        suffix: `<!-- -->`
    };

const swapCalls = (node: ts.Expression, comp: CompDefinition): ts.Expression => {
    const toProto = (n: ts.Node) => {
        const clone = ts.getMutableClone(n);

        if (ts.isCallExpression(n)) {
            const newArgs: ts.Expression[] = ['props', 'state', 'volatile'].map(a => ts.createIdentifier(a));
            n.arguments.forEach(a => newArgs.push(cloneDeep(a)));
            return cCall(
                [comp.name, 'prototype', `_${printAstText(n.expression)}`],
                newArgs
            );
        }
        clone.forEachChild(toProto);
        return clone;
    };
    return toProto(node) as ts.Expression;
};

export const jsxComponentReplacer: AstNodeReplacer =
    node => {
        if ((ts.isJsxElement(node) && isComponentTag(node.openingElement.tagName)) ||
            (ts.isJsxSelfClosingElement(node) && isComponentTag(node.tagName))) {
            const openingNode = ts.isJsxElement(node) ? node.openingElement : node;
            const tagName = printAst(openingNode.tagName);

            return {
                expression: cCall([tagName, 'factory', 'toString'],
                    [
                        cObject(openingNode.attributes.properties.reduce((accum, prop) => {
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
                        }, {} as Record<string, any>))
                    ]),
            };
        }
        return false;
    };
