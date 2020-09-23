import ts from 'typescript';
import { UsedVariables } from './types';
import { set } from 'lodash';
import { asCode } from '..';
import { isType, modifyingOperators, selfModifyingOperators, isVariableLikeDeclaration, isAccessNode, accessToStringArr, addToAccessMap, withRef } from './find-used-variables.helpers';
export { mergeUsedVariables } from './find-used-variables.helpers';

interface Visitor {
    (n: ts.Node | undefined, root?: boolean | number): void;
    postFix: string[];
    res: UsedVariables;
}

/**
 *
 * @param node
 * @param ignore return true to ignore a node and its children
 */
export function findUsedVariables(node: ts.Node, ignore?: (node: ts.Node) => boolean): UsedVariables {
    const visitor: Visitor = (n?: ts.Node, root = false) => {
        try {
            if (!n || isType(n)) {
                return;
            }
            if (!root && ignore && ignore(n)) {
                return;
            }

            if ((!root && handleVarDeclaration(n, visitor))
                || handleCall(n, visitor)
                || handlePropertyAccess(n, visitor)
                || handleLiteralObject(n, visitor)
            ) {
                return;
            }
            ts.forEachChild(n, visitor);
        } catch (e) {
            e.original = e.original || e.message || '';
            e.message = `Error in: ${asCode(n!)}${e.src ? '\nCause: ' + e.original + ' in ' + e.src : ''}`;
            e.src = e.src || asCode(n!);
            throw e;
        }
    };
    visitor.postFix = [];
    visitor.res = {
        accessed: {},
        modified: {},
        defined: {},
        read: {},
        executed: {},
    };

    visitor(node, true);
    return visitor.res;
}

function handlePropertyAccess(n: ts.Node, visitor: Visitor) {
    const { res } = visitor;
    if (ts.isPropertyAccessExpression(n) || ts.isIdentifier(n) || ts.isElementAccessExpression(n)) {
        const accessParent: ts.Node = n.parent || n;
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
        addToAccessMap(visitor.postFix, paths.path, isModification, res, accessParent);

        for (const path of paths.nestedAccess) {
            addToAccessMap(visitor.postFix, path, isModification, res, accessParent);
        }
        return true;
    }
    return false;
}

function getModificationStatus(n: ts.Node) {
    const accessParent: ts.Node = n.parent || n;
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

function handleVarDeclaration(n: ts.Node, visitor: Visitor) {
    const { res, postFix } = visitor;
    if (isVariableLikeDeclaration(n)) {
        if (ts.isVariableDeclaration(n)) {
            if (ts.isObjectBindingPattern(n.name) || ts.isArrayBindingPattern(n.name)) {
                n.name.elements.forEach(e => {
                    const name = asCode((e as any).name);
                    if (name) {
                        res.defined[name] = withRef(n);
                        // tslint:disable: no-unused-expression
                        if (ts.isObjectBindingPattern(n.name) && isAccessNode(n.initializer)) {
                            postFix.push(name);
                            handleLiteralObject(n.initializer, visitor) || visitor(n.initializer);
                            postFix.pop();
                        } else {
                            handleLiteralObject(n.initializer, visitor) || visitor(n.initializer);
                        }
                    }
                });
                return true;
            }
            res.defined[asCode(n.name)] = withRef(n);
            handleLiteralObject(n.initializer, visitor) || visitor(n.initializer);
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

function handleLiteralObject(init: ts.Node | undefined, visitor: Visitor) {
    const { res } = visitor;
    if (init) {
        if (ts.isObjectLiteralExpression(init)) {
            init.properties.forEach(
                p => {
                    if (ts.isShorthandPropertyAssignment(p)) {
                        addToAccessMap(visitor.postFix, asCode(p.name), false, res, init.parent, true);
                    }
                    if (ts.isPropertyAssignment(p) && ts.isComputedPropertyName(p.name)) {
                        addToAccessMap(visitor.postFix, asCode(p.name.expression), false, res, init.parent, true);
                    }
                    // @ts-ignore
                    visitor(p.initializer);
                }
            );
            return true;
        }
    }
    return false;
}

function handleCall(n: ts.Node, visitor: Visitor) {
    const { res } = visitor;
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
