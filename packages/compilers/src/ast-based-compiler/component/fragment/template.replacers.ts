import { cloneDeep, CompDefinition, findUsedVariables, asCode, cCall, isComponentTag, AstNodeReplacer, cObject } from "@tsx-air/compiler-utils";
import ts from "typescript";
import { getGenericMethodParams } from "../helpers";

export const jsxTextExpressionReplacer: (comp: CompDefinition, executedFuncs: string[]) => AstNodeReplacer = (comp, executedFuncs) => node => {
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
                const name = asCode(n.expression);
                executedFuncs.push(name);
                return cCall([comp.name, 'prototype', `_${name}`], args);
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
        /////
        const tagName = asCode(openingNode.tagName);

        return {
            expression: cCall(
                [tagName, 'factory', 'toString'],
                [cObject(
                    openingNode.attributes.properties.reduce((acc, prop) => {
                        if (ts.isJsxSpreadAttribute(prop)) {
                            throw new Error('spread in attributes is not handled yet');
                        }
                        const initializer = prop.initializer;
                        ///////
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
                )]
            )
        };
    }
    return false;
};
