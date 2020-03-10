import { findUsedVariables, CompDefinition, FuncDefinition, createBitWiseOr, cloneDeep, cCall, cArrow, cMethod, printAstText, cProperty, cAccess } from '@tsx-air/compiler-utils';
import flatMap from 'lodash/flatMap';
import ts from 'typescript';
import { uniqueId } from 'lodash';
import { getGenericMethodParams, destructureState, destructureVolatile } from './helpers';
import { STATE } from '../consts';

export function* generateMethods(comp: CompDefinition) {
    let lambdaId = 0;
    for (const func of comp.functions) {
        func.name = func.name || `lambda${lambdaId++}`;
        yield generateStateAwareMethod(comp, func);
        yield generateMethodBind(func);
    }
}

export function generateMethodBind(func: FuncDefinition) {
    return cProperty(func.name!,
        cArrow(func.arguments!,
            cCall(['TSXAir', 'runtime', 'execute'],
                [
                    ts.createThis(),
                    cAccess('this', `_${func.name}`),
                    ...func.arguments!.map(a => ts.createIdentifier(a))
                ]
            )));
}

export function generateStateAwareMethod(comp: CompDefinition, func: FuncDefinition) {
    const method = asMethod(comp, func);
    const { statements } = method.body!;
    method.body!.statements = ts.createNodeArray([
        ...[destructureState(comp, func.aggregatedVariables), destructureVolatile(comp, func.aggregatedVariables)].filter(i => i) as ts.VariableStatement[],
       ...statements.map(s => {
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
    })]);
    return method;
}

function asMethod(comp: CompDefinition, func: FuncDefinition): ts.MethodDeclaration {
    const { sourceAstNode: src, name } = func;
    const clone = cloneDeep(src);
    if (!ts.isBlock(clone.body!)) {
        clone.body = ts.createBlock([ts.createReturn(clone.body)]);
    }

    const params = getGenericMethodParams(comp, func.aggregatedVariables, true, false);
    src.parameters.forEach(p => params.push(printAstText(p.name)));

    return cMethod(name ? `_${name}` : uniqueId('_anonymous'), params, clone.body);
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
                ts.createIdentifier(STATE),
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
