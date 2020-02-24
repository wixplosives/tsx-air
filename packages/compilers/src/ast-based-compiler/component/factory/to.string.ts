import { propsAndStateParams } from '../helpers';
import { cArrow, jsxToStringTemplate, jsxAttributeNameReplacer, jsxAttributeReplacer, JsxRoot, CompDefinition, isComponentTag, cCall, cObject, AstNodeReplacer, cloneDeep, jsxSelfClosingElementReplacer, jsxEventHandlerRemover, printAst } from '@tsx-air/compiler-utils';
import ts from 'typescript';
import { extractPreRender } from '../function';

export const generateToString = (node: JsxRoot, comp: CompDefinition) => {
    const preRender = extractPreRender(comp, true);
    const template = jsxToStringTemplate(node.sourceAstNode, [
        jsxComponentReplacer,
        jsxEventHandlerRemover,
        jsxTextExpressionReplacer,
        jsxAttributeReplacer,
        jsxAttributeNameReplacer,
        jsxSelfClosingElementReplacer,
    ]);
    return cArrow(propsAndStateParams(comp),
        preRender?.length
            ? [...preRender, ts.createReturn(template)]
            : template);
};

export const jsxTextExpressionReplacer: AstNodeReplacer =
    node => ts.isJsxExpression(node) &&
        !ts.isJsxAttribute(node.parent) &&
    {
        prefix: `<!-- ${node.expression ? printAst(node.expression) : 'empty expression'} -->`,
        expression: node.expression ? cloneDeep(node.expression) : ts.createTrue(),
        suffix: `<!-- -->`
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
