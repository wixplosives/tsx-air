import { cArrow, jsxToStringTemplate, jsxAttributeNameReplacer, jsxAttributeReplacer, JsxRoot, CompDefinition, isComponentTag, cCall, cObject, AstNodeReplacer, cloneDeep, jsxSelfClosingElementReplacer } from '@tsx-air/compiler-utils';
import ts from 'typescript';

export const generateToString = (node: JsxRoot, comp: CompDefinition) => {
    const props = comp.usedProps.length ? comp.propsIdentifier || 'props' : undefined;
    
    const stores = comp.stores.map(s => 
        ts.createBindingElement(
            undefined,
            undefined,
            ts.createIdentifier(s.name),
            undefined
        ));
        const state = stores.length ? ts.createObjectBindingPattern(stores) : undefined;


    return cArrow([props, state],
        jsxToStringTemplate(node.sourceAstNode, [
            jsxComponentReplacer,
            jsxTextExpressionReplacer,
            jsxAttributeReplacer,
            jsxAttributeNameReplacer,
            jsxSelfClosingElementReplacer
        ]));
};

export const jsxTextExpressionReplacer: AstNodeReplacer =
    node => ts.isJsxExpression(node) &&
        !ts.isJsxAttribute(node.parent) &&
    {
        prefix: `<!-- ${node.expression ? node.expression.getText() : 'empty expression'} -->`,
        expression: node.expression ? cloneDeep(node.expression) : ts.createTrue(),
        suffix: `<!-- ${node.expression ? node.expression.getText() : 'empty expression'} -->`
    };

export const jsxComponentReplacer: AstNodeReplacer =
    node => {
        if ((ts.isJsxElement(node) && isComponentTag(node.openingElement.tagName)) ||
            (ts.isJsxSelfClosingElement(node) && isComponentTag(node.tagName))) {
            const openingNode = ts.isJsxElement(node) ? node.openingElement : node;
            const tagName = openingNode.tagName.getText();

            return {
                expression: cCall([tagName, 'factory', 'toString'],
                    [
                        cObject(openingNode.attributes.properties.reduce((accum, prop) => {
                            if (ts.isJsxSpreadAttribute(prop)) {
                                throw new Error('spread in attributes is not handled yet');
                            }
                            const initializer = prop.initializer;
                            if (!initializer) {
                                accum[prop.name.getText()] = ts.createTrue();
                            } else if (ts.isJsxExpression(initializer)) {
                                if (initializer.expression) {
                                    accum[prop.name.getText()] = cloneDeep(initializer.expression);
                                }
                            } else {
                                accum[prop.name.getText()] = cloneDeep(initializer);
                            }
                            return accum;
                        }, {} as Record<string, any>))
                    ]),
            };
        }
        return false;
    };
