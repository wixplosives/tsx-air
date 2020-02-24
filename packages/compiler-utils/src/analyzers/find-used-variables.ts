import ts from 'typescript';
import { UsedVariables, RecursiveMap } from './types';
import { update, merge } from 'lodash';
import { printAstText } from '..';

/**
 * 
 * @param node 
 * @param filter return true to ignore a node and its children
 */
export function findUsedVariables(node: ts.Node, filter?: (node: ts.Node) => boolean): UsedVariables {
    const res: UsedVariables = {
        accessed: {},
        modified: {},
        defined: {}
    };
    const visitor = (n: ts.Node) => {
        if (filter && filter(n)) {
            return;
        }
        if (isType(n)) {
            return;
        }
        const accessParent = n.parent;
        if (isVariableLikeDeclaration(accessParent) && printAstText(accessParent.name) === printAstText(n)) {
            if (isVariableDeclaration(accessParent)) {
                res.defined[printAstText(n)] = {};
            }
            return;
        }

        if (ts.isPropertyAccessExpression(n) || ts.isIdentifier(n) || ts.isElementAccessExpression(n)) {
            if (ts.isJsxSelfClosingElement(accessParent) || ts.isJsxOpeningElement(accessParent) || ts.isJsxClosingElement(accessParent) && n === accessParent.tagName) {
                return;
            }
            let isModification = false;
            if (ts.isBinaryExpression(accessParent) && printAstText(accessParent.left) === printAstText(n)) {
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
    ts.SyntaxKind.BarEqualsToken,
];

export const selfModifyingOperators = [
    ts.SyntaxKind.PlusPlusToken,
    ts.SyntaxKind.MinusMinusToken
];

export const isType = (node: ts.Node) => ts.isInterfaceDeclaration(node) || ts.isTypeNode(node) || ts.isTypeReferenceNode(node) || ts.isTypeAliasDeclaration(node);

export function isVariableLikeDeclaration(node: ts.Node): node is ts.VariableLikeDeclaration {
    return ts.isVariableDeclaration(node) ||
        ts.isParameter(node) ||
        ts.isBindingElement(node) ||
        ts.isPropertyDeclaration(node) ||
        ts.isPropertyAssignment(node) ||
        ts.isPropertySignature(node) ||
        ts.isJsxAttribute(node) ||
        ts.isShorthandPropertyAssignment(node) ||
        ts.isEnumMember(node) ||
        ts.isJSDocPropertyTag(node) ||
        ts.isJSDocParameterTag(node);
}

export function isVariableDeclaration(node: ts.Node): node is ts.VariableDeclaration | ts.ParameterDeclaration {
    return ts.isVariableDeclaration(node) ||
        ts.isParameter(node);
}

export type AccessNodes = ts.Identifier | ts.PropertyAccessExpression | ts.ElementAccessExpression;
export function isAccessNode(node: ts.Node): node is AccessNodes {
    return ts.isIdentifier(node) || ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node);
}
export function accessToStringArr(node: AccessNodes): { path: string[], nestedAccess: string[][] } {
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

            path.unshift(printAstText(n.name));
            n = n.expression;
        }
    }

    if (!ts.isIdentifier(n)) {
        throw new Error('unhandled input in accessToStringArr');
    }
    path.unshift(printAstText(n));
    return {
        path,
        nestedAccess
    };
}

function addToAccessMap(path: string[], isModification: boolean, map: UsedVariables) {
    update(map.accessed, path, i => i || {});
    if (isModification) {
        update(map.modified, path, i => i || {});
    }
}

export const mergeUsedVariables = (variables: UsedVariables[]): UsedVariables =>
    variables.reduce(
        (acc: RecursiveMap, map: RecursiveMap) => merge(acc, map),
        {
            accessed: {},
            modified: {},
            defined: {}
        }) as UsedVariables;
