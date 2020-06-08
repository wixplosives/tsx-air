import { CompDefinition, isComponentTag, asCode, cloneDeep } from "@tsx-air/compiler-utils";
import { FragmentData } from "./jsx.fragment";
import ts from "typescript";

export function* GenerateVirtualComponents(comp: CompDefinition, fragment: FragmentData) {
    let components = 0;
    const visitor = (node: ts.Node) => {
        if (
            (ts.isJsxElement(node) && isComponentTag(node.openingElement.tagName)) ||
            (ts.isJsxSelfClosingElement(node) && isComponentTag(node.tagName))
        ) {
            const openingNode = ts.isJsxElement(node) ? node.openingElement : node;
            const tagName = asCode(openingNode.tagName);
            // const props = getCompProps(openingNode.attributes.properties);
            // const mapping = getPropsMapping(comp, openingNode.attributes.properties);
            
            components++;

            return {
                prefix: '<!--C-->',
                suffix: '<!--C-->',
                expression: cCall(
                    ['this', 'factory', 'toString'],
                    [cObject(
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
                    )]
                )
            };
        }
    }
    const getUsedComponents = fragment.src.forEachChild(visitor);

}