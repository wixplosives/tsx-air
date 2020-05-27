import { getGenericMethodParams, dependantOnVars, compFuncByName } from './helpers';
import {
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
    asCode,
    findUsedVariables,
    UsedInScope,
    asAst
} from '@tsx-air/compiler-utils';
import ts from 'typescript';
import { defaultsDeep } from 'lodash';
import { getFragmentData, Fragment } from './jsx.fragment';

export const generateFragmentToString = (node: JsxRoot, comp: CompDefinition) => {
    const executedFuncs = [] as string[];
    const fragments = [] as Fragment[];

    const element = (node.sourceAstNode);
    // const element = cloneDeep(node.sourceAstNode);
    
    // ts.getMutableClone(node.sourceAstNode);
    // let withAttr: { attributes: ts.JsxAttributes } = element as ts.JsxSelfClosingElement;    
    // if (!ts.isJsxSelfClosingElement(element)) {
    //     element.openingElement = ts.getMutableClone(element.openingElement);
    //     withAttr = element.openingElement;
    // }
    // withAttr.attributes = ts.createJsxAttributes(
    //     [...withAttr.attributes.properties,
    //     ts.createJsxAttribute(ts.createIdentifier('xFgKey'), ts.createJsxExpression(
    //         undefined,
    //         ts.createIdentifier("$key")
    //     )
    //     )
    //     ]);
    const jsx = asAst(asCode(element), true);

    const template = jsxToStringTemplate(element, [
        jsxFragmentReplacer(fragments, node),
        jsxComponentReplacer,
        jsxEventHandlerRemover,
        jsxTextExpressionReplacer(comp, executedFuncs),
        jsxAttributeReplacer,
        jsxAttributeNameReplacer,
        jsxSelfClosingElementReplacer,
    ]);

    const usedByFuncs: UsedInScope = {};
    executedFuncs.forEach(f => {
        const func = compFuncByName(comp, f);
        if (func) {
            defaultsDeep(usedByFuncs, dependantOnVars(comp, func.aggregatedVariables));
        }
    });

    return template;

};

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
                n.arguments.forEach(a => args.push(cloneDeep(a) as ts.Identifier | ts.Expression));
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

export const jsxFragmentReplacer: (frags: Fragment[], root: JsxRoot) => AstNodeReplacer = (fragments, root) => node => {
    const fragData = getFragmentData(node);
    if (fragData) {
        if (node !== root.sourceAstNode) {
            fragments.push(fragData);
            const expression = asAst(`${fragData.id}.toString({$key: ${fragments.length}})`) as ts.CallExpression;
            (expression as any).src = root.sourceAstNode;
            return {
                prefix: `<!-- Fragment: ${fragData.id}} -->`,
                expression,
                suffix: `<!-- -->`
            };
        } else {
            (node as any).src = node;
            return false;
        }
    } else {
        return false;
    }
}

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


export const jsxFragmentAddKey: (frags: Fragment[], root: JsxRoot) => AstNodeReplacer = (fragments, root) => node => {
    if (node === root.sourceAstNode) {
        return asAst(asCode(node), true);
    } else {
        return false;
    }
}
