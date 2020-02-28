import { propsAndStateParams } from '../helpers';
import { cArrow, jsxToStringTemplate, jsxAttributeNameReplacer, jsxAttributeReplacer, JsxRoot, CompDefinition, isComponentTag, cCall, cObject, AstNodeReplacer, cloneDeep, jsxSelfClosingElementReplacer, jsxEventHandlerRemover, printAst, cConst } from '@tsx-air/compiler-utils';
import ts from 'typescript';

export const generateToString = (node: JsxRoot, comp: CompDefinition) => {
    const template = jsxToStringTemplate(node.sourceAstNode, [
        jsxComponentReplacer,
        jsxEventHandlerRemover,
        jsxTextExpressionReplacer,
        jsxAttributeReplacer,
        jsxAttributeNameReplacer,
        jsxSelfClosingElementReplacer,
    ]);
    const params = propsAndStateParams(comp, true);

    if (comp.volatileVariables.length) {
        const volatile = cConst('volatile', cCall([comp.name!, '$preRender'], [
            ts.createIdentifier(comp.propsIdentifier || 'props'),
            ts.createIdentifier('state')
        ]));
        const execute = cArrow(params, template);
        return cArrow(['props', 'state'], [
            volatile,
            ts.createReturn(
                ts.createCall(
                    ts.createParen(execute),
                    undefined,
                    [
                        ts.createIdentifier('props'),
                        ts.createIdentifier('state'),
                        ts.createIdentifier('volatile')
                    ],
                ))]);
    } else {
        return cArrow(params, template);
    }
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
