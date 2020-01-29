import { cArrow, jsxToStringTemplate, jsxComponentReplacer, jsxAttributeNameReplacer, jsxAttributeReplacer, jsxTextExpressionReplacer, JsxRoot, CompDefinition } from "@tsx-air/compiler-utils";

export const generateToString = (node: JsxRoot, parentComp: CompDefinition) => {
    return cArrow([parentComp.propsIdentifier || 'props'],
        jsxToStringTemplate(node.sourceAstNode, [
            jsxComponentReplacer,
            jsxTextExpressionReplacer,
            jsxAttributeReplacer,
            jsxAttributeNameReplacer
        ]));
};