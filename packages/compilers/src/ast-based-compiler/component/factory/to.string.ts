import { cArrow, jsxToStringTemplate, jsxComponentReplacer, jsxAttributeNameReplacer, jsxAttributeReplacer, jsxTextExpressionReplacer, JsxRoot, CompDefinition } from "@tsx-air/compiler-utils";

export const generateToString = (node: JsxRoot, comp: CompDefinition) => {
    return cArrow([comp.propsIdentifier || 'props', 'state'],
        jsxToStringTemplate(node.sourceAstNode, [
            jsxComponentReplacer,
            jsxTextExpressionReplacer,
            jsxAttributeReplacer,
            jsxAttributeNameReplacer
        ]));
};