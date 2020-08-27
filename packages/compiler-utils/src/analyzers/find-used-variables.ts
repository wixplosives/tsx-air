import ts from 'typescript';
import { UsedVariables, RecursiveMap } from './types';
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
        executed: {},
    };
    const visitor = (n: ts.Node) => {
        if (ignore && ignore(n) || isType(n)) {
            return;
        }
        if (n.parent) {
            if (handleVarDeclaration(n, res)
                || handleCall(n, res, visitor)) {
                return;
            }
            if (!handlePropertyAccess(n, res)) {
                ts.forEachChild(n, visitor);
            }
        } else {
            ts.forEachChild(n, visitor);
        }
    };
    ts.forEachChild(node, visitor);
    return res;
}

function handlePropertyAccess(n: ts.Node, res: UsedVariables) {
    if (ts.isPropertyAccessExpression(n) || ts.isIdentifier(n) || ts.isElementAccessExpression(n)) {
        const accessParent: ts.Node = n.parent;
        if (ts.isVariableDeclaration(accessParent) && ts.isObjectBindingPattern(accessParent.name)) {
            return true;
        }
        if (
            ts.isJsxSelfClosingElement(accessParent) ||
            ts.isJsxOpeningElement(accessParent) ||
            (ts.isJsxClosingElement(accessParent) && n === accessParent.tagName)
        ) {
            return true;
        }
        const isModification = getModificationStatus(n);
        const paths = accessToStringArr(n);

        if (ts.isNewExpression(n)) {
            return true;
        }
        addToAccessMap(paths.path, isModification, res, accessParent);

        for (const path of paths.nestedAccess) {
            addToAccessMap(path, isModification, res, accessParent);
        }
        return true;
    }
    return false;
}

function getModificationStatus(n: ts.Node) {
    const accessParent: ts.Node = n.parent;
    let isModification: 'self' | boolean = false;
    if (ts.isBinaryExpression(accessParent) && asCode(accessParent.left) === asCode(n)) {
        if (modifyingOperators.find(item => item === accessParent.operatorToken.kind)) {
            isModification = true;
        }
        if (selfModifyingOperators.find(item => item === accessParent.operatorToken.kind)) {
            isModification = 'self';
        }
    } else if (ts.isPostfixUnaryExpression(accessParent) || ts.isPrefixUnaryExpression(accessParent)) {
        isModification = 'self';
    }
    return isModification;
}

function handleVarDeclaration(n: ts.Node, res: UsedVariables) {
    const accessParent: ts.Node = n.parent;
    if (isVariableLikeDeclaration(accessParent) && asCode(accessParent.name) === asCode(n)) {
        if (ts.isVariableDeclaration(accessParent) && ts.isObjectBindingPattern(n)) {
            n.elements.forEach(e => {
                const name = asCode(e.name);
                res.defined[name] = withRef(accessParent);
                const init = asCode(accessParent.initializer!);
                addToAccessMap(`${init}.${name}`, false, res, accessParent, true);
                addToAccessMap(`${init}.${name}`, false, res, accessParent, true);
            });
            return true;
        }
        if (isVariableDeclaration(accessParent) || ts.isFunctionDeclaration(accessParent)) {
            const definedAs = asCode(n);
            res.defined[definedAs] = withRef(accessParent);
        }
        return true;
    }
    return false;
}

function handleCall(n: ts.Node, res: UsedVariables, visitor: (n: ts.Node) => void) {
    if (ts.isCallExpression(n) && n.expression && asCode(n.expression)) {
        set(res.executed, asCode(n.expression), withRef(n));
        set(res.accessed, asCode(n.expression), withRef(n));
        n.arguments.forEach(visitor);
        return true;
    }
    return false;
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
            } else if (ts.isNumericLiteral(n.argumentExpression)) {
                path = [];
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

    if (asCode(n).startsWith('this.') || asCode(n.parent).startsWith('this.')) {
        return {
            path: [],
            nestedAccess: []
        };
    }
    if (ts.isNewExpression(n)) {
        return {
            path,
            nestedAccess
        };
    }
    if (!(ts.isIdentifier(n) || ts.isNonNullExpression(n))) {
        throw new Error('unhandled input in accessToStringArr');
    }
    path.unshift(asCode(n));
    return {
        path,
        nestedAccess
    };
}

function withRef(ref: ts.Node, target?: RecursiveMap) {
    target = target || {};
    target.$refs = target.$refs || [];
    if (!target.$refs.includes(ref)) {
        target.$refs.push(ref);
    }
    return target;
}

function addToAccessMap(path: string | string[], isModification: 'self' | boolean, map: UsedVariables, ref: ts.Node, ignoreRefInitializer = false) {
    if (path.length === 0) {
        return;
    }
    ref = (!ignoreRefInitializer && !isModification
        && (ref as ts.VariableDeclaration).initializer)
        ? (ref as ts.VariableDeclaration).initializer!
        : ref;
    if (ts.isTemplateSpan(ref)) {
        ref = ref.parent;
    }

    update(map.accessed, path, i => withRef(ref, i));
    if (isModification) {
        update(map.modified, path, i => withRef(ref, i));
        if (isModification === 'self') {
            update(map.read, path, i => withRef(ref, i));
        }
    } else {
        update(map.read, path, i => withRef(ref, i));
    }
}

export const mergeUsedVariables = (variables: UsedVariables[]): UsedVariables =>
    variables.reduce((acc: UsedVariables, map: UsedVariables) => merge(acc, map), {
        accessed: {},
        modified: {},
        defined: {},
        read: {}
    } as UsedVariables);
