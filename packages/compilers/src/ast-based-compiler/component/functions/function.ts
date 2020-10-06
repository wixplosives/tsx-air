import { CompDefinition, FuncDefinition, cloneDeep, cMethod, cProperty, asAst, cFunction, UserCode, isCompDefinition } from '@tsx-air/compiler-utils';
import ts from 'typescript';
import { setupClosure } from '../helpers';
import { FragmentData } from '../fragment/jsx.fragment';
import { get } from 'lodash';
import { assignFunctionNames, readFuncName, addNamedFunctions, namedFuncs } from './names';
import { swapVirtualElements, enrichLifeCycleApiFunc, swapLambdas, handleArrowFunc, swapVarDeclarations } from './swappers';

export function* generateMethods(code: UserCode, fragments: FragmentData[]) {
    assignFunctionNames(code);
    if (isCompDefinition(code)) {
        yield generateRender(code);
    }
    yield generateUserCode(code, fragments);
    for (const func of code.functions) {
        // TODO replace with Parameter[]
        yield generateMethod(code, `_${readFuncName(func)}`, func.sourceAstNode.body, fragments, func.parameters.map(a => a.name));
        yield generateMethodBind(func);
    }
}

function generateRender(comp: CompDefinition) {
    return cMethod('render', ['p', 't', 'a'],
        [asAst(`return Component._render(getInstance(), ${comp.name}, p, t, a);`, true) as ts.Statement], true);
}

function generateUserCode(code: UserCode, fragments: FragmentData[]) {
    const body = get(code.sourceAstNode.arguments[0], 'body');
    const statements = get(body, 'statements') || [body];
    const modified = [
        ...addNamedFunctions(code),
        ...parseStatements(code, statements, fragments, true)
    ];
    return asMethod(code, 'userCode', [], modified, true);
}

function parseStatements(code: UserCode, statements: ts.Statement[], fragments: FragmentData[], isPreRender: boolean) {
    const declaredVars = new Set<string>();
    const { parser } = createScriptTransformCtx(code, fragments, declaredVars, isPreRender);
    const parsed = statements.map(parser);
    if (isPreRender) {
        if (declaredVars.size) {
            parsed.splice(-1, 0, asAst(`this.volatile={${[...declaredVars, ...namedFuncs(code)].join(',')
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
    code: UserCode;
    allowLifeCycleApiCalls: boolean;
    fragments: FragmentData[];
    declaredVars: Set<string>;
    parser: (s: ts.Node, skipArrow?: any) => ts.Statement;
}

const createScriptTransformCtx = (code: UserCode, fragments: FragmentData[], declaredVars?: Set<string>, allowLifeCycleApiCalls: boolean = false) => {
    declaredVars = declaredVars || new Set<string>();
    const ctx: CompScriptTransformCtx = {
        allowLifeCycleApiCalls,
        apiCalls: 0,
        code, fragments, declaredVars: declaredVars!,
        parser: (s: ts.Node, skipArrow?: any) => {
            const ret = cloneDeep<ts.Node, ts.Node>(s, undefined, n =>
                swapVarDeclarations(ctx, n) ||
                swapLambdas(ctx, n) ||
                enrichLifeCycleApiFunc(ctx, n) ||
                handleArrowFunc(ctx, n, skipArrow) ||
                swapVirtualElements(ctx, n)
            ) as ts.Statement;
            return ret;
        }
    };
    return ctx;
};

function generateMethod(code: UserCode, name: string, body: ts.Node, fragments: FragmentData[], args: string[]) {
    const statements = get(body, 'statements') || [body];
    const modified = [...parseStatements(code, statements, fragments, false)];
    return asMethod(code, name, args, modified);
}

const asMethod = (code: UserCode, name: string, args: string[], statements: ts.Statement[], isPreRender = false) => cMethod(name, args, [
    ...setupClosure(code, statements, isPreRender),
    ...statements]);

export const asFunction = (method: ts.MethodDeclaration) =>
    cFunction(method.parameters.map(i => i), method.body!);

