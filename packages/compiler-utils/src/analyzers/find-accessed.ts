import ts from 'typescript';
import { UsedVariables } from './types';

/**
 * 
 * @param node 
 * @param filter return true to ignore a node and its children
 */
export function findAccessedMembers(node: ts.Node, filter?: (node: ts.Node) => boolean): UsedVariables {
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
        if (isVariableLikeDeclaration(accessParent) && accessParent.name === n) {
            if (isVariableDeclaration(accessParent)) {
                res.defined[n.getText()] = {};
            }
            return;
        }

        if (ts.isPropertyAccessExpression(n) || ts.isIdentifier(n) || ts.isElementAccessExpression(n)) {

            let isModification = false;
            if (ts.isBinaryExpression(accessParent) && accessParent.left === n) {
                if (modifyingOperators.find(item => item === accessParent.operatorToken.kind)) {
                    isModification = true;
                }
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

            path.unshift(n.name.getText());
            n = n.expression;
        }
    }

    if (!ts.isIdentifier(n)) {
        throw new Error('unhandled input in accessToStringArr');
    }
    path.unshift(n.getText());
    return {
        path,
        nestedAccess
    };
}

export function addToAccessMap(path: string[], isModification: boolean, map: UsedVariables) {
    let modMap = map.modified;
    let accessMap = map.accessed;

    for (const part of path) {
        if (!accessMap[part]) {
            accessMap[part] = {};
        }
        accessMap = accessMap[part];
        if (isModification) {
            if (!modMap[part]) {
                modMap[part] = {};
            }
            modMap = modMap[part];
        }
    }
}

