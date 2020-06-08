import { findUsedVariables, CompDefinition, FuncDefinition, cloneDeep, cMethod, asCode, cProperty, asAst, cFunction } from '@tsx-air/compiler-utils';
import ts from 'typescript';
import { getGenericMethodParams, dependantOnVars, addToClosure } from './helpers';
import { postAnalysisData } from '../../common/post.analysis.data';

export function nameFunctions(comp: CompDefinition) {
    for (const func of comp.functions) {
        writeFuncName(func, func.name || nextLambdaName(comp));
    }
}

export function aggregateDependencies(comp: CompDefinition) {
    return comp.aggregatedVariables;
}

export function* generateMethods(comp: CompDefinition) {
    nameFunctions(comp);
    for (const func of comp.functions) {
        yield generateStateAwareMethod(comp, func);
        yield generateMethodBind(func);
    }
}

export const readFuncName = (func: FuncDefinition) => postAnalysisData.read(func, 'name')!;
export const writeFuncName = (func: FuncDefinition, name: string) =>
    postAnalysisData.write(func, 'name', name);

export function generateMethodBind(func: FuncDefinition) {
    const name = readFuncName(func);
    return cProperty(name,
        asAst(`(...args)=>this._${name}(...args)`) as ts.Expression
    );
}

export function generateStateAwareMethod(comp: CompDefinition, func: FuncDefinition) {
    const method = asMethod(comp, func);
    const body = method.body!;
    const { statements } = body;

    const vars = dependantOnVars(comp, func.aggregatedVariables);
    const methods = Object.keys(func.aggregatedVariables.executed).filter(
        name => comp.functions.some(fn => fn.name === name)
    );
    body.statements = ts.createNodeArray([
        ...addToClosure(vars),
        ...addToClosure(methods),
        ...statements.map(toStateSafe(comp))]);
    return method;
}

const toStateSafe = (comp: CompDefinition) => (s: ts.Statement) => {
    if (isStoreDefinition(comp, s)) {
        throw new Error('stores may only be declared in the main component body');
    }
    if (ts.isExpressionStatement(s)) {
        return cStateCall(comp, s.expression) || s;
    }
    if (ts.isReturnStatement(s) && s.expression) {
        return cStateCall(comp, s.expression) || s;
    }
    return s;
};

export const nextLambdaName = (comp: CompDefinition) =>
    'lambda' + postAnalysisData.write(comp, 'lambdaCount', i => i ? i++ : 0);

function asMethod(comp: CompDefinition, func: FuncDefinition): ts.MethodDeclaration {
    const { sourceAstNode: src } = func;

    const name = `_${readFuncName(func)}`;
    const clone = cloneDeep(src);
    if (!ts.isBlock(clone.body!)) {
        clone.body = ts.createBlock([ts.createReturn(clone.body)]);
    }

    const params = getGenericMethodParams(comp, func.aggregatedVariables, true, false);
    src.parameters.forEach(p => params.push(asCode(p.name)));

    return cMethod(name, params, clone.body);
}

export function isStoreDefinition(comp: CompDefinition, node: ts.Statement | ts.VariableDeclaration) {
    if (ts.isVariableStatement(node)) {
        const used = findUsedVariables(node);
        return comp.stores.some(store => used.defined[store.name]);
    }
    if (ts.isVariableDeclaration(node)) {
        const name = asCode(node.name);
        return comp.stores.some(store => store.name === name);
    }
    return false;
}

export const cStateCall = (comp: CompDefinition, exp: ts.Expression) => {
    const used = findUsedVariables(exp);
    const changeBits: string[] = [];
    const usedStores: string[] = [];
    for (const [store, v] of Object.entries(used.modified || {})) {
        if (comp.stores.some(({ name }) => name === store)) {
            usedStores.push(store);
            Object.keys(v).forEach(field => changeBits.push(`${comp.name}.changeBitmask['${store}.${field}']`));
        }
    }

    const stores = usedStores.join(',');

    return changeBits.length === 0
        ? undefined
        : asAst(`TSXAir.runtime.updateState(this, ({${stores}})=>{
            ${asCode(exp)};
            return ${changeBits.join('|')};
        })`) as ts.ExpressionStatement;
};

export const asFunction = (method: ts.MethodDeclaration) =>
    cFunction(method.parameters.map(i => i), method.body!);  
