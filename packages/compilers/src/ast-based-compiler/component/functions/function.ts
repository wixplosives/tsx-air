import { CompDefinition, FuncDefinition, cloneDeep, cMethod, cProperty, asAst, cFunction, UserCode, isCompDefinition } from '@tsx-air/compiler-utils';
import ts, { NodeArray } from 'typescript';
import { setupClosure } from '../helpers';
import { FragmentData } from '../fragment/jsx.fragment';
import { get } from 'lodash';
import { assignFunctionNames, readFuncName, addNamedFunctions } from './names';
import { swapVirtualElements, enrichLifeCycleApiFunc, swapLambdas, handleArrowFunc, swapVarDeclarations, Swapper } from './swappers';

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
    ] as ts.Statement[];
    return asMethod(code, 'userCode', [], modified, true);
}

function parseStatements(code: UserCode, statements: ts.Statement[], fragments: FragmentData[], isUserCode: boolean) {
    const declaredVars = new Set<string>();
    const { parser } = createScriptTransformCtx(code, fragments, declaredVars, isUserCode);
    const parsed = [...flatGen(statements, parser)];
    return parsed;
}

function generateMethodBind(func: FuncDefinition) {
    const name = readFuncName(func)!;
    return cProperty(name,
        asAst(`this.volatile.${name}=(...args)=>this._${name}(...args);`) as ts.Expression
    );
}

export interface CompScriptTransformCtx {
    apiCalls: number;
    code: UserCode;
    isMainUserCode: boolean;
    fragments: FragmentData[];
    declaredVars: Set<string>;
    parser: (s: ts.Node, skipArrow?: any) => Generator<ts.Node>;
}

export const createScriptTransformCtx = (code: UserCode, fragments: FragmentData[], declaredVars?: Set<string>, isMainUserCode: boolean = false) => {
    declaredVars = declaredVars || new Set<string>();
    const ctx: CompScriptTransformCtx = {
        isMainUserCode,
        apiCalls: 0,
        code, fragments, declaredVars: declaredVars!,
        *parser(s: ts.Node, skipArrow?: any) {
            const swappers: Swapper[] = [
                swapVarDeclarations,
                swapLambdas,
                enrichLifeCycleApiFunc,
                handleArrowFunc,
                swapVirtualElements
            ];

            let rest!: Generator<ts.Node>;
            yield cloneDeep(s, undefined, n => {
                if (ts.isBlock(n)) {
                    return ts.createBlock([...flatGen(n.statements, ctx.parser)]
                        .filter(parsed => !ts.isEmptyStatement((parsed))) as ts.Statement[]);
                }
                for (const swapper of swappers) {
                    const result = swapper(n, ctx, skipArrow, isMainUserCode);
                    const next = result.next();
                    if (!next.done) {
                        rest = result;
                        return next.value as ts.Statement;
                    }
                    if (next.value) {
                        return ts.createEmptyStatement();
                    }
                }
                return;
            }) as ts.Statement;
            if (rest) {
                yield* rest;
            }
        }
    };
    return ctx;
};

function generateMethod(code: UserCode, name: string, body: ts.Node, fragments: FragmentData[], args: string[]) {
    const statements = get(body, 'statements') || [body];
    const modified = [...parseStatements(code, statements, fragments, false)] as ts.Statement[];
    return asMethod(code, name, args, modified);
}

const asMethod = (code: UserCode, name: string, args: string[], statements: ts.Statement[], isUserCode = false) => cMethod(name, args, [
    ...setupClosure(code, statements, isUserCode),
    ...statements
]);



export const asFunction = (method: ts.MethodDeclaration) =>
    cFunction(method.parameters.map(i => i), method.body!);

function* flatGen<T extends ts.Node>(arr: T[] | NodeArray<T>, fn: (item: T) => Generator<T>) {
    for (const item of arr) {
        yield* fn(item);
    }
}