import { findUsedVariables, CompDefinition, FuncDefinition, createBitWiseOr, cloneDeep, cCall, cArrow, cMethod, cReturnLiteral, printAstText } from '@tsx-air/compiler-utils';
import flatMap from 'lodash/flatMap';
import ts from 'typescript';
import { uniqueId } from 'lodash';

export function generateStateAwareMethod(comp: CompDefinition, func: FuncDefinition) {
    const method = asMethod(func);
    const { statements } = method.body!;
    method.body!.statements = ts.createNodeArray(statements.map(s => {
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
    return method;
}

function asMethod(func: FuncDefinition): ts.MethodDeclaration {
    const { sourceAstNode: src, name } = func;
    const clone = cloneDeep(src);
    if (!ts.isBlock(clone.body!)) {
        clone.body = ts.createBlock([ts.createReturn(clone.body)]);
    }
    return cMethod(name ? `_${name}` : uniqueId('_anonymous'), src.parameters, clone.body);
}

export function isStoreDefinition(comp: CompDefinition, node: ts.Statement | ts.VariableDeclaration) {
    if (ts.isVariableStatement(node)) {
        const used = findUsedVariables(node);
        return comp.stores.some(store => used.defined[store.name]);
    }
    if (ts.isVariableDeclaration(node)) {
        const name = printAstText(node.name);
        return comp.stores.some(store => store.name === name);
    }
    return false;
}

export const cStateCall = (comp: CompDefinition, exp: ts.Expression, preRender: boolean) => {
    const used = findUsedVariables(exp);
    const changeBits = flatMap(used.modified,
        (v, m) => Object.keys(v).map(k => `${m}.${k}`));

    return changeBits.length === 0
        ? undefined
        : ts.createExpressionStatement(cCall(['TSXAir', 'runtime', 'updateState'],
            [
                ts.createThis(),
                cArrow([ts.createObjectBindingPattern(
                    comp.stores.map(s =>
                        ts.createBindingElement(
                            undefined,
                            undefined,
                            ts.createIdentifier(s.name),
                        )
                    ))], ts.createBlock(
                        [
                            ts.createExpressionStatement(cloneDeep(exp, undefined)),
                            ts.createReturn(createBitWiseOr(comp.name!, changeBits, preRender
                                ? ['preRender']
                                : undefined))
                        ],
                        true
                    )
                )
            ]
        ));
};

export const asFunction = (method: ts.MethodDeclaration) =>
    cArrow(method.parameters.map(i => i), method.body!);  
