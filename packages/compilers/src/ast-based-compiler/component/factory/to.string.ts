import { dependantOnVars, getGenericMethodParams, addToClosure } from '../helpers';
import {
    jsxToStringTemplate,
    jsxAttributeNameReplacer,
    jsxAttributeReplacer,
    CompDefinition,
    cCall,
    jsxSelfClosingElementReplacer,
    jsxEventHandlerRemover,
    findUsedVariables,
    AstNodeReplacer,
    isComponentTag,
    asCode,
    cloneDeep,
    cObject,
    cCompactArrow,
    asAst
} from '@tsx-air/compiler-utils';
import ts from 'typescript';

export const generateToString = (comp: CompDefinition) => {
    const executedFuncs = [] as string[];
    const template =
        jsxToStringTemplate(comp.jsxRoots[0].sourceAstNode, [
            jsxComponentReplacer,
            jsxEventHandlerRemover,
            jsxTextExpressionReplacer(comp, executedFuncs),
            jsxAttributeReplacer,
            jsxAttributeNameReplacer,
            jsxSelfClosingElementReplacer
        ]);

    const usedVars = dependantOnVars(comp, findUsedVariables(template), true);

    return cCompactArrow([], [...addToClosure(usedVars), ...addToClosure(executedFuncs)], template);
};

export const jsxTextExpressionReplacer: (comp: CompDefinition, executedFuncs: string[]) => AstNodeReplacer =
    (comp, executedFuncs) => {
        let expressionCount = 0;

        return node => {
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
                        n.arguments.forEach(a => args.push(cloneDeep(a) as ts.Identifier | ts.Expression));
                        const name = asCode(n.expression);
                        executedFuncs.push(name);
                        return cCall(['this.owner', name], args);
                    }
                    clone.forEachChild(toProto);
                    return clone;
                };
                return toProto(exp) as ts.Expression;
            };
            if (ts.isJsxExpression(node) && !ts.isJsxAttribute(node.parent)) {
                const expression = node.expression ? swapCalls(node.expression as ts.JsxExpression) : ts.createTrue();

                expressionCount++;
                return [
                    {
                        prefix: `<!--exp[`,
                        expression: asAst(`this.getFullKey()+']${expressionCount}'`) as ts.Expression,
                        suffix: `-->`
                    },
                    {expression},
                    {
                        prefix: `<!--/exp[`,
                        expression: asAst(`this.getFullKey()+']${expressionCount}'`) as ts.Expression,
                        suffix: `-->`
                    }
                ];
            } else {
                return false;
            }
        };
    };

export const jsxComponentReplacer: AstNodeReplacer = node => {
    if (
        (ts.isJsxElement(node) && isComponentTag(node.openingElement.tagName)) ||
        (ts.isJsxSelfClosingElement(node) && isComponentTag(node.tagName))
    ) {
        const openingNode = ts.isJsxElement(node) ? node.openingElement : node;
        const tagName = asCode(openingNode.tagName);

        return {
            expression: cCall(
                [tagName, 'factory', 'toString'],
                [
                    cObject(
                        openingNode.attributes.properties.reduce((acc, prop) => {
                            if (ts.isJsxSpreadAttribute(prop)) {
                                throw new Error('spread in attributes is not handled yet');
                            }
                            const initializer = prop.initializer;
                            const name = asCode(prop.name);
                            if (!initializer) {
                                acc[name] = ts.createTrue();
                            } else if (ts.isJsxExpression(initializer)) {
                                if (initializer.expression) {
                                    acc[name] = cloneDeep(initializer.expression);
                                }
                            } else {
                                acc[name] = cloneDeep(initializer);
                            }
                            return acc;
                        }, {} as Record<string, any>)
                    )
                ]
            )
        };
    }
    return false;
};
