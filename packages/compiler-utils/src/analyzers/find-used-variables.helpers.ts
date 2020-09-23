import { update, merge, isString } from 'lodash';
import ts from 'typescript';
import { asCode, RecursiveMap, UsedVariables } from '..';

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
export function isAccessNode(node?: ts.Node): node is AccessNodes {
    return !!node && (ts.isIdentifier(node)
        || ts.isPropertyAccessExpression(node)
        || ts.isElementAccessExpression(node));
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
        if (ts.isCallExpression(n)) {

            return {
                path: [],
                nestedAccess
            };
        }
        throw new Error('Error finding used vars in:\n' + asCode(n));
    }
    path.unshift(asCode(n));
    return {
        path,
        nestedAccess
    };
}

export function withRef(ref: ts.Node, target?: RecursiveMap) {
    target = target || {};
    target.$refs = target.$refs || [];
    if (!target.$refs.includes(ref)) {
        target.$refs.push(ref);
    }
    return target;
}

export function addToAccessMap(postFix: string[], path: string | string[], isModification: 'self' | boolean, map: UsedVariables, ref: ts.Node, ignoreRefInitializer = false) {
    if (path.length === 0) {
        return;
    }
    ref = simplifyRef(ref, ignoreRefInitializer, isModification);

    if (postFix.length) {
        if (isString(path)) {
            path = path + '.' + postFix.join('.');
        } else {
            path.push(...postFix);
        }
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
function simplifyRef(ref: ts.Node, ignoreRefInitializer: boolean, isModification: string | boolean) {
    ref = (!ignoreRefInitializer && !isModification
        && (ref as ts.VariableDeclaration).initializer)
        ? (ref as ts.VariableDeclaration).initializer!
        : ref;

    while (isAccessNode(ref) && isAccessNode(ref.parent)) {
        ref = ref.parent;
    }
    if (ts.isTemplateSpan(ref) || isAccessNode(ref)) {
        ref = ref.parent;
    }
    return ref;
}