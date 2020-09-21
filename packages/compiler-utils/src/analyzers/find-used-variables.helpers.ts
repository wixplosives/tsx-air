import ts from 'typescript';

export const modifyingOperators = [
    ts.SyntaxKind.EqualsToken,
    ts.SyntaxKind.PlusEqualsToken,
    ts.SyntaxKind.MinusEqualsToken,
    ts.SyntaxKind.AsteriskEqualsToken,
    ts.SyntaxKind.AsteriskAsteriskEqualsToken,
    ts.SyntaxKind.SlashEqualsToken,
    ts.SyntaxKind.PercentEqualsToken,
    ts.SyntaxKind.LessThanLessThanEqualsToken,
    ts.SyntaxKind.GreaterThanGreaterThanEqualsToken,
    ts.SyntaxKind.GreaterThanGreaterThanGreaterThanEqualsToken,
    ts.SyntaxKind.AmpersandEqualsToken,
    ts.SyntaxKind.BarEqualsToken
];


export const selfModifyingOperators = [
    ts.SyntaxKind.PlusPlusToken,
    ts.SyntaxKind.PlusEqualsToken,
    ts.SyntaxKind.MinusEqualsToken,
    ts.SyntaxKind.AsteriskEqualsToken,
    ts.SyntaxKind.AsteriskAsteriskEqualsToken,
    ts.SyntaxKind.SlashEqualsToken,
    ts.SyntaxKind.PercentEqualsToken,
    ts.SyntaxKind.AmpersandEqualsToken,
    ts.SyntaxKind.BarEqualsToken
];

export const isType = (node: ts.Node) =>
    ts.isInterfaceDeclaration(node) ||
    ts.isTypeNode(node) ||
    ts.isTypeReferenceNode(node) ||
    ts.isTypeAliasDeclaration(node);

export function isVariableLikeDeclaration(node: ts.Node): node is ts.VariableLikeDeclaration | ts.FunctionDeclaration {
    return (
        ts.isVariableDeclaration(node) ||
        ts.isParameter(node) ||
        ts.isBindingElement(node) ||
        ts.isPropertyDeclaration(node) ||
        ts.isPropertyAssignment(node) ||
        ts.isPropertySignature(node) ||
        ts.isJsxAttribute(node) ||
        ts.isShorthandPropertyAssignment(node) ||
        ts.isEnumMember(node) ||
        ts.isJSDocPropertyTag(node) ||
        ts.isJSDocParameterTag(node) ||
        ts.isFunctionDeclaration(node)
    );
}

export function isVariableDeclaration(node: ts.Node): node is ts.VariableDeclaration | ts.ParameterDeclaration {
    return ts.isVariableDeclaration(node) || ts.isParameter(node);
}

export type AccessNodes = ts.Identifier | ts.PropertyAccessExpression | ts.ElementAccessExpression;
export function isAccessNode(node: ts.Node): node is AccessNodes {
    return ts.isIdentifier(node) || ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node);
}
