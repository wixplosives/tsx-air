import ts from 'typescript';
import { UsedVariables, RecursiveMap } from './types';
import { update, merge, set, isString } from 'lodash';
import { asCode } from '..';
import { isType, modifyingOperators, selfModifyingOperators, isVariableLikeDeclaration, AccessNodes, isAccessNode, isVariableDeclaration } from './find-used-variables.helpers';

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
        if (!n || (ignore && ignore(n)) || isType(n)) {
            return;
        }
        if (handleVarDeclaration(n, res, visitor)
            || handleCall(n, res, visitor)
            || handlePropertyAccess(n, res)) {
            return;
        }
        ts.forEachChild(n, visitor);
    };

    ts.forEachChild(node, visitor);
    return res;
}

function handlePropertyAccess(n: ts.Node, res: UsedVariables) {
    if (ts.isPropertyAccessExpression(n) || ts.isIdentifier(n) || ts.isElementAccessExpression(n)) {
        const accessParent: ts.Node = n.parent;
        if (
            ts.isJsxSelfClosingElement(accessParent) ||
            ts.isJsxOpeningElement(accessParent) ||
            (ts.isJsxClosingElement(accessParent) && n === accessParent.tagName)
        ) {
            return true;
        }
        if (ts.isJsxAttribute(accessParent) && n === accessParent.name) {
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

function handleVarDeclaration(n: ts.Node, res: UsedVariables, visitor: (n: ts.Node) => void) {
    if (isVariableLikeDeclaration(n)) {
        if (ts.isVariableDeclaration(n)) {
            if (ts.isObjectBindingPattern(n.name) || ts.isArrayBindingPattern(n.name)) {
                n.name.elements.forEach(e => {
                    const name = asCode((e as any).name);
                    if (name) {
                        res.defined[name] = withRef(n);
                        if (ts.isObjectBindingPattern(n.name)) {
                            const { initializer } = n;
                            if (initializer) {
                                postFix.push(name);
                                addInitializer(n, res, visitor);
                                postFix.pop();
                            }
                        } else {
                            addInitializer(n, res, visitor);
                        }
                    }
                });
                return true;
            }
            res.defined[asCode(n.name)] = withRef(n);
            addInitializer(n, res, visitor);
            return true;
        }
        if (ts.isFunctionDeclaration(n) && n.name) {
            res.defined[asCode(n.name)] = withRef(n);
            return false;
        }
        if (ts.isParameter(n)) {
            res.defined[asCode(n.name)] = withRef(n);
            return true;
        }

        return false;
    }
    return false;
}

function addInitializer(n: ts.VariableDeclaration, res: UsedVariables, visitor: (n: ts.Node) => void) {
    const { initializer: init } = n;

    if (init) {
        if (ts.isObjectLiteralExpression(init)) {
            init.properties.forEach(
                p => {
                    if (ts.isShorthandPropertyAssignment(p)) {
                        addToAccessMap(asCode(p.name), false, res, n, true);
                    }
                    if (ts.isPropertyAssignment(p) && ts.isComputedPropertyName(p.name)) {
                        addToAccessMap(asCode(p.name.expression), false, res, n, true);
                    }
                    // @ts-ignore
                    visitor(p.initializer);
                }
            );
        } else {
            visitor(init);
        }
    }
}

function handleCall(n: ts.Node, res: UsedVariables, visitor: (n: ts.Node) => void) {
    if (ts.isCallExpression(n) && n.expression && asCode(n.expression)) {
        set(res.executed, asCode(n.expression), withRef(n));
        set(res.accessed, asCode(n.expression), withRef(n));
        n.arguments.forEach(visitor);
        if (ts.isPropertyAccessExpression(n.expression)) {
            if (ts.isCallExpression(n.expression.expression)) {
                visitor(n.expression.expression);
            }
        }
        return true;
    }
    return false;
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

function withRef(ref: ts.Node, target?: RecursiveMap) {
    target = target || {};
    target.$refs = target.$refs || [];
    if (!target.$refs.includes(ref)) {
        target.$refs.push(ref);
    }
    return target;
}

const postFix: string[] = [];

function addToAccessMap(path: string | string[], isModification: 'self' | boolean, map: UsedVariables, ref: ts.Node, ignoreRefInitializer = false) {
    if (path.length === 0) {
        return;
    }
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
    /////////
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
