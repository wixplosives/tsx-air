import { CompDefinition, FuncDefinition, cloneDeep, cMethod, cProperty, asAst, cFunction } from '@tsx-air/compiler-utils';
import ts from 'typescript';
import { setupClosure } from '../helpers';
import { FragmentData } from '../fragment/jsx.fragment';
import { get } from 'lodash';
import { assignFunctionNames, readFuncName, addNamedFunctions, namedFuncs } from './names';
import { swapVarDeclarations, swapVirtualElements, enrichLifeCycleApiFunc, swapLambdas, handleArrowFunc } from './swappers';

export function* generateMethods(comp: CompDefinition, fragments: FragmentData[]) {
    assignFunctionNames(comp);
    yield generateRender(comp);
    yield generatePreRender(comp, fragments);
    for (const func of comp.functions) {
        yield generateMethod(comp, `_${readFuncName(func)}`, func.sourceAstNode.body, fragments, func.arguments);
        yield generateMethodBind(func);
    }
}

function generateRender(comp: CompDefinition) {
    return cMethod('render', ['p', 't', 'a'],
        [asAst(`return Component._render(getInstance(), ${comp.name}, p, t, a);`, true) as ts.Statement], true);
}

function generatePreRender(comp: CompDefinition, fragments: FragmentData[]) {
    const body = get(comp.sourceAstNode.arguments[0], 'body');
    const statements = get(body, 'statements') || [body];
    const modified = [
        ...addNamedFunctions(comp),
        ...parseStatements(comp, statements, fragments, true)
    ];
    return asMethod(comp, 'preRender', [], modified, true);
}

function parseStatements(comp: CompDefinition, statements: ts.Statement[], fragments: FragmentData[], isPreRender: boolean) {
    const declaredVars = new Set<string>();
    const {parser} = createCompScriptTransformCtx(comp, fragments, declaredVars, isPreRender);
    const parsed = statements.map(parser);
    if (isPreRender) {
        if (declaredVars.size) {
            parsed.splice(-1, 0, asAst(`this.volatile={${
                [...declaredVars, ...namedFuncs(comp)].join(',')
                }}`) as ts.Statement);
        }
    }
    return parsed.filter(s => !ts.isEmptyStatement(s));
}

function generateMethodBind(func: FuncDefinition) {
    const name = readFuncName(func);
    return cProperty(name,
        asAst(`(...args)=>this._${name}(...args)`) as ts.Expression
    );
}

export interface CompScriptTransformCtx {
    apiCalls: number;
    comp: CompDefinition;
    allowLifeCycleApiCalls:boolean;
    fragments: FragmentData[];
    declaredVars: Set<string>;
    parser: (s: ts.Node, skipArrow?: any) => ts.Statement;
}

const createCompScriptTransformCtx = (comp: CompDefinition, fragments: FragmentData[], declaredVars?: Set<string>, allowLifeCycleApiCalls: boolean = false) => {
    declaredVars = declaredVars || new Set<string>();
    const ctx:CompScriptTransformCtx = { 
        allowLifeCycleApiCalls,
        apiCalls: 0,
        comp, fragments, declaredVars:declaredVars!,
        parser: (s: ts.Node, skipArrow?: any) => {
            const ret = cloneDeep<ts.Node, ts.Node>(s, undefined, n => {
                return swapVarDeclarations(ctx, n) ||
                    swapLambdas(n) ||
                    enrichLifeCycleApiFunc(ctx, n) ||
                    handleArrowFunc(ctx, n, skipArrow) ||
                    swapVirtualElements(ctx, n);
            }) as ts.Statement;
            return ret;
        }
    };
    return ctx;
};

function generateMethod(comp: CompDefinition, name: string, body: ts.Node, fragments: FragmentData[], args: string[]) {
    const statements = get(body, 'statements') || [body];
    const modified = [...parseStatements(comp, statements, fragments, false)];
    return asMethod(comp, name, args, modified);
}

const asMethod = (comp: CompDefinition, name: string, args: string[], statements: ts.Statement[], isPreRender = false) => cMethod(name, args, [
    ...setupClosure(comp, statements, isPreRender),
    ...statements]);

export const asFunction = (method: ts.MethodDeclaration) =>
    cFunction(method.parameters.map(i => i), method.body!);

