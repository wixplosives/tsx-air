import { findUsedVariables, CompDefinition, FuncDefinition, cloneDeep, cArrow, cMethod, asCode, cProperty, asAst, UsedVariables } from '@tsx-air/compiler-utils';
import flatMap from 'lodash/flatMap';
import ts from 'typescript';
import { getGenericMethodParams, destructureState, destructureVolatile } from './helpers';
import { STATE } from '../consts';
import { postAnalysisData } from '../../common/post.analysis.data';

export function nameFunctions(comp: CompDefinition) {
    for (const func of comp.functions) {
        postAnalysisData.write(func, 'name', func.name || nextLambdaName(comp));
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

export function generateMethodBind(func: FuncDefinition) {
    const name = postAnalysisData.read(func, 'name')!;
    return cProperty(name,
        asAst(`(...args)=>TSXAir.runtime.execute(this, this._${name}, args)`) as ts.Expression
    );
}

export function generateStateAwareMethod(comp: CompDefinition, func: FuncDefinition) {
    const method = asMethod(comp, func);
    const body = method.body!;
    const { statements } = body;

    body.statements = ts.createNodeArray([
        ...destructureStatements(comp, func.aggregatedVariables),
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

const destructureStatements = (comp: CompDefinition, scope: UsedVariables) => [
    destructureState(comp, scope),
    destructureVolatile(comp, scope)
].filter(i => i) as ts.VariableStatement[];

export const nextLambdaName = (comp: CompDefinition) =>
    'lambda' + postAnalysisData.write(comp, 'lambdaCount', i => i ? i++ : 0);

function asMethod(comp: CompDefinition, func: FuncDefinition): ts.MethodDeclaration {
    const { sourceAstNode: src } = func;

    const name = `_${postAnalysisData.read(func, 'name')}`;
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
    const changeBits = flatMap(used.modified,
        (v, m) => Object.keys(v).map(k =>
            `${comp.name}.changeBitmask['${m}.${k}']`));

    const stores = comp.stores.map(s => s.name).join(',');

    return changeBits.length === 0
        ? undefined
        : asAst(`TSXAir.runtime.updateState(this, ${STATE}, ({${stores}})=>{
            ${asCode(exp)};
            return ${changeBits.join('|')};
        })`) as ts.ExpressionStatement;
};

export const asFunction = (method: ts.MethodDeclaration) =>
    cArrow(method.parameters.map(i => i), method.body!);  
