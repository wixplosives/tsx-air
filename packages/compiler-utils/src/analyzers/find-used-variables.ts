import ts from 'typescript';
import { UsedVariables } from './types';
import { update, merge, set } from 'lodash';
import { asCode } from '..';

/**
 *
 * @param node
 * @param ignore return true to ignore a node and its children
 */
export function findUsedVariables(node: ts.Node, ignore?: (node: ts.Node) => boolean): UsedVariables {
    const res: UsedVariables = {
        accessed: {},
        modified: {},
        defined: {},
        read: {},
        executed: {}
    };
    const visitor = (n: ts.Node) => {
        if (ignore && ignore(n)) {
            return;
        }
        if (isType(n)) {
            return;
        }
        const accessParent = n.parent;
        if (accessParent) {
            if (isVariableLikeDeclaration(accessParent) && asCode(accessParent.name) === asCode(n)) {
                if (isVariableDeclaration(accessParent) || ts.isFunctionDeclaration(accessParent)) {
                    res.defined[asCode(n)] = {};
                }
                return ;
            }
            if (ts.isCallExpression(n) && n.expression && asCode(n.expression)) {
                set(res.executed, asCode(n.expression), {});
            }

            if (ts.isPropertyAccessExpression(n) || ts.isIdentifier(n) || ts.isElementAccessExpression(n)) {
                if (
                    ts.isJsxSelfClosingElement(accessParent) ||
                    ts.isJsxOpeningElement(accessParent) ||
                    (ts.isJsxClosingElement(accessParent) && n === accessParent.tagName)
                ) {
                    return;
                }
                let isModification = false;
                if (ts.isBinaryExpression(accessParent) && asCode(accessParent.left) === asCode(n)) {
                    if (modifyingOperators.find(item => item === accessParent.operatorToken.kind)) {
                        isModification = true;
                    }
                } else if (ts.isPostfixUnaryExpression(accessParent) || ts.isPrefixUnaryExpression(accessParent)) {
                    isModification = true;
                }
                const paths = accessToStringArr(n);

                addToAccessMap(paths.path, isModification, res);
                for (const path of paths.nestedAccess) {
                    addToAccessMap(path, isModification, res);
                }
            } else {
                ts.forEachChild(n, visitor);
            }
            return;
        } else {
            ts.forEachChild(n, visitor);
            return;
        }
    };
    ts.forEachChild(node, visitor);
    return res;
}

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

export const selfModifyingOperators = [ts.SyntaxKind.PlusPlusToken, ts.SyntaxKind.MinusMinusToken];

export const isType = (node: ts.Node) =>
    ts.isInterfaceDeclaration(node) ||
    ts.isTypeNode(node) ||
    ts.isTypeReferenceNode(node) ||
    ts.isTypeAliasDeclaration(node);

export function isVariableLikeDeclaration(node: ts.Node): node is ts.VariableLikeDeclaration {
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
export function accessToStringArr(node: AccessNodes): { path: string[]; nestedAccess: string[][] } {
    let n: ts.LeftHandSideExpression = node;
    let path: string[] = [];
    const nestedAccess: string[][] = [];
    while (ts.isPropertyAccessExpression(n) || ts.isElementAccessExpression(n)) {
        if (ts.isElementAccessExpression(n)) {
            if (ts.isStringLiteral(n.argumentExpression)) {
                path.unshift(n.argumentExpression.text);
            } else if (isAccessNode(n.argumentExpression)) {
                const innerAccess = accessToStringArr(n.argumentExpression);
                nestedAccess.push(innerAccess.path, ...innerAccess.nestedAccess);
                path = [];
            } else {
                throw new Error('unhandled input in accessToStringArr');
            }
            n = n.expression;
        } else {
            path.unshift(asCode(n.name));
            n = n.expression;
        }
    }

    if (!ts.isIdentifier(n)) {
        throw new Error('unhandled input in accessToStringArr');
    }
    path.unshift(asCode(n));
    return {
        path,
        nestedAccess
    };
}

function addToAccessMap(path: string[], isModification: boolean, map: UsedVariables) {
    update(map.accessed, path, i => i || {});
    if (isModification) {
        update(map.modified, path, i => i || {});
    } else {
        update(map.read, path, i => i || {});
    }
}

export const mergeUsedVariables = (variables: UsedVariables[]): UsedVariables =>
    variables.reduce((acc: UsedVariables, map: UsedVariables) => merge(acc, map), {
        accessed: {},
        modified: {},
        defined: {},
        read: {}
    } as UsedVariables);
