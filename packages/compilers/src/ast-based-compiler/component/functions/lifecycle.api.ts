import { asAst, asCode, findUsedVariables } from '@tsx-air/compiler-utils';
import ts from 'typescript';
import { getRecursiveMapPaths } from '../helpers';
import { isInlineComp } from './inline.class';
import { readFuncName, readNodeFuncName } from './names';
import { Swapper } from './swappers';

export const enrichLifeCycleApiFunc: Swapper = function* (node, ctx) {
    if ((ts.isExpressionStatement(node) && ts.isCallExpression(node.expression))
        || (ts.isVariableDeclaration(node) && node.initializer && ts.isCallExpression(node.initializer))) {
        const call = (ts.isExpressionStatement(node) ? node.expression : node.initializer) as ts.CallExpression;
        let apiCall: LifeCycleApiFunctions = asCode(call.expression) as LifeCycleApiFunctions;
        if (ctx.code.functions.filter(isInlineComp).find(fn => readFuncName(fn) === apiCall)) {
            apiCall = 'inline';
            lifeCycleApiArgsManipulators.inline = (_, callId, inlineCall, n) => {
                const inlineComp = asCode(inlineCall.expression);
                const hooksArgs = inlineCall.arguments.map(a => asCode(a)).join(',');
                return enrichedApiCall('inline', [`this`, callId, `${ctx.code.name}.${inlineComp}`, `[${hooksArgs}]`], n);
            };

        }
        const argsManipulator = lifeCycleApiArgsManipulators[apiCall];
        if (argsManipulator) {
            ctx.apiCalls++;
            const callId = ts.isVariableDeclaration(node) ? JSON.stringify(asCode(node.name)) : ctx.apiCalls;
            if (ctx.isMainUserCode) {
                yield argsManipulator(apiCall, '' + callId, call, node);
                return;
            } else {
                throw new Error(`Invalid ${apiCall} call: should only be used component body (i.e. not in functions)`);
            }
        }
    }
    return;
};

type LifeCycleApiFunctions = 'when' | 'memo' | 'afterDomUpdate' | 'store' | 'afterMount' | 'use' | 'inline';
type Enricher = (apiCall: LifeCycleApiFunctions, callId: string, call: ts.CallExpression, node: ts.Node) => ts.Expression | ts.VariableDeclaration;

const enrichedApiCall = (apiCall: LifeCycleApiFunctions, params: string[], node: ts.Node) => {
    const enriched = asAst(`${apiCall}(${params.join(',')})`) as ts.Expression;
    return ts.isVariableDeclaration(node)
        ? ts.createVariableDeclaration(node.name, undefined, enriched)
        : enriched;
};

const args = (callId: string, call: ts.CallExpression, beforeRest: string[] = []) => {
    const isActionFirstArg = !!readNodeFuncName(call.arguments[0]);
    const actionName = readNodeFuncName(call.arguments[isActionFirstArg ? 0 : 1]);
    const params = [`this`, callId, actionName ? `this.${actionName}` : asCode(call.arguments[0]),];
    params.push(...beforeRest);
    params.push(...getOtherArgs(call, isActionFirstArg));
    return params;
};

const noFilter: Enricher = (apiCall, callId, call, node) =>
    enrichedApiCall(apiCall, args(callId, call), node);

const withOptionalFilter: Enricher = (apiCall, callId, call, node) =>
    enrichedApiCall(apiCall, args(callId, call, [
        getDependencies(call, !!readNodeFuncName(call.arguments[0]), true)
    ]), node);

const afterDomUpdate: Enricher = (apiCall, callId, call, node) =>
    enrichedApiCall(apiCall, args(callId, call, [
        getDependencies(call, !!readNodeFuncName(call.arguments[0]), false)
    ]), node);

const use: Enricher = (_use, callId, call, node) => {
    const hookCall = call.arguments[0] as ts.CallExpression;
    const hookName = asCode(hookCall.expression);
    const hooksArgs = hookCall.arguments.map(a => asCode(a)).join(',');
    return enrichedApiCall('use', [`this`, callId, hookName, `[${hooksArgs}]`], node);
};

const lifeCycleApiArgsManipulators: Record<LifeCycleApiFunctions, Enricher> = {
    'when': withOptionalFilter,
    'memo': withOptionalFilter,
    afterDomUpdate,
    'store': noFilter,
    'afterMount': noFilter,
    use,
    'inline': null as any as Enricher
};

function getDependencies(call: ts.CallExpression, isActionFirstArg: boolean, findVars: boolean) {
    if (isActionFirstArg) {
        if (!findVars) {
            return 'false';
        }
        const vars = findUsedVariables(call.arguments[0]);
        Object.keys(vars.defined).forEach(k => delete vars.read[k]);
        const read = getRecursiveMapPaths(vars.read);

        return `[${read.join(',')}]`;
    }
    return ts.isArrayLiteralExpression(call.arguments[0])
        ? asCode(call.arguments[0])
        : `[${asCode(call.arguments[0])}]`;
}

const getOtherArgs = (call: ts.CallExpression, isActionFirstArg: boolean) =>
    call.arguments.filter((_, index) =>
        // @ts-ignore
        index > (1 & !isActionFirstArg)).map(arg =>
            asCode(arg));
