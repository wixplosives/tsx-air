import { findUsedVariables, CompDefinition, FuncDefinition, createBitWiseOr, cloneDeep } from '@tsx-air/compiler-utils';
import flatMap from 'lodash/flatMap';
import ts from 'typescript';
import get from 'lodash/get';

export function generateStateAwareFunction(comp: CompDefinition, func: FuncDefinition) {
    const clone = withBlockBody(func.sourceAstNode);
    const { statements } = (clone.body as ts.Block);
    clone.body.statements = ts.createNodeArray(statements.map(s => {
        if (isStoreDefinition(comp, s)) {
            throw new Error('stores may only be declared in the main component body');
        }
        if (ts.isExpressionStatement(s)) {
            return cStateCall(comp, s.expression, false) || s;
        }
        if (ts.isReturnStatement(s) && s.expression) {
            return cStateCall(comp, s.expression, false) || s;
        }
        return s;
    }));
    return clone;
}

export function extractPreRender(comp: CompDefinition, removeStateChanges=false): ts.Statement[] {
    const statements =
        get(comp.sourceAstNode.arguments[0], 'body.statements') as ts.Statement[];

    if (!statements?.length) {
        return [];
    }
    const modified = statements.map(s => {
        if (isStoreDefinition(comp, s)) {
            return;
        }
        if (ts.isExpressionStatement(s)) {
            const stateChange = cStateCall(comp, s.expression, true);
            if (removeStateChanges && stateChange) {
                return;
            }
            return stateChange
                ? cIfNotPreRender(stateChange)
                : cloneDeep(s);
        }
        if (ts.isReturnStatement(s)) {
            return;
        }
        if (ts.isVariableStatement(s)) {
            return removeClosureFunctions(s);
        }
        return cloneDeep(s);

        // TODO: add general inner functions support, this coe should help:
        // const ff = comp.functions.find(f => {
        //     const srcStatement = (clone.body as ts.Block).statements ?
        //         (clone.body as ts.Block).statements[i] : clone.body;
        //     return (ts.isVariableStatement(srcStatement))
        //         && srcStatement.declarationList.declarations.find(
        //             d => printAst(d.initializer!) === printAst(f.sourceAstNode)
        //         );
        // });
        // if (ff) {
        //     const ss = (s as ts.VariableStatement);
        //     const modFunc = generateStateAwareFunction(comp, ff);
        //     ss.declarationList.declarations[0].initializer = modFunc;
        // }

    }).filter(i => i) as ts.Statement[];
    return modified;
}

const removeClosureFunctions = (vars: ts.VariableStatement) => {
    const noFuncs = vars.declarationList.declarations.filter(({ initializer }) => initializer &&
        !ts.isArrowFunction(initializer) && !ts.isFunctionExpression(initializer));
    if (noFuncs.length) {
        const clone = cloneDeep(vars);
        clone.declarationList.declarations = ts.createNodeArray(noFuncs);
        return clone;
    } else {
        return undefined;
    }
};

interface ArrowFunctionWithBlockBody extends ts.ArrowFunction {
    body: ts.FunctionBody;
}


function withBlockBody(src: ts.ArrowFunction | ts.FunctionExpression): ArrowFunctionWithBlockBody {
    const clone = cloneDeep(src);
    if (!ts.isBlock(clone.body!)) {
        clone.body = ts.createBlock([ts.createReturn(clone.body)]);
    }
    if (ts.isFunctionExpression(src)) {
        return ts.createArrowFunction(
            undefined,
            clone.typeParameters, clone.parameters, clone.type,
            undefined,
            clone.body
        ) as ArrowFunctionWithBlockBody;
    }
    return clone as ArrowFunctionWithBlockBody;
}

const isStoreDefinition = (comp: CompDefinition, node: ts.Statement) => {
    if (ts.isVariableStatement(node)) {
        const used = findUsedVariables(node);
        return comp.stores.some(store => used.defined[store.name]);
    }
    return false;
};

const cStateCall = (comp: CompDefinition, exp: ts.Expression, preRender: boolean) => {
    const used = findUsedVariables(exp);
    const changeBits = flatMap(used.modified,
        (v, m) => Object.keys(v).map(k => `${m}.${k}`));

    return changeBits.length === 0
        ? undefined
        : ts.createExpressionStatement(ts.createCall(
            ts.createPropertyAccess(
                ts.createPropertyAccess(
                    ts.createIdentifier('TSXAir'),
                    ts.createIdentifier('runtime')
                ),
                ts.createIdentifier('updateState')
            ),
            undefined,
            [
                ts.createThis(),
                ts.createArrowFunction(
                    undefined,
                    undefined,
                    [ts.createParameter(
                        undefined,
                        undefined,
                        undefined,
                        ts.createObjectBindingPattern(
                            comp.stores.map(s =>
                                ts.createBindingElement(
                                    undefined,
                                    undefined,
                                    ts.createIdentifier(s.name),
                                )
                            )),
                    )],
                    undefined,
                    ts.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
                    ts.createBlock(
                        [
                            ts.createExpressionStatement(cloneDeep(exp, undefined)),
                            ts.createReturn(createBitWiseOr(comp.name!, changeBits, preRender ? ['preRender'] : undefined))
                        ],
                        true
                    )
                )
            ]
        ));
};

const cIfNotPreRender = (ifTrue: ts.ExpressionStatement) =>
    ts.createIf(
        ts.createIdentifier('externalUpdatesCount'),
        ts.createBlock(
            [ifTrue],
            true
        ),
        undefined
    );