import { findUsedVariables, CompDefinition, FuncDefinition, cloneDeep, cMethod, asCode, cProperty, asAst, cFunction, JsxComponent, JsxExpression, setNodeSrc } from '@tsx-air/compiler-utils';
import ts from 'typescript';
import { setupClosure, dependantOnVars, getChangeBitsNames } from './helpers';
import { postAnalysisData } from '../../common/post.analysis.data';
import { FragmentData } from './fragment/jsx.fragment';
import { safely } from '@tsx-air/utils';
import { chain, get } from 'lodash';

export function* generateMethods(comp: CompDefinition, fragments: FragmentData[]) {
    assignFunctionNames(comp);
    yield generatePreRender(comp, fragments);
    for (const func of comp.functions) {
        yield generateMethod(comp, `_${readFuncName(func)}`, func.sourceAstNode.body, fragments, func.arguments);
        yield generateMethodBind(func);
    }
}

export const readFuncName = (func: FuncDefinition) => postAnalysisData.read(func, 'name')!;
export const readNodeFuncName = (func: ts.Node) => postAnalysisData.readByAst(func, 'name')!;
export const writeFuncName = (func: FuncDefinition, name: string) =>
    postAnalysisData.write(func, 'name', name);

function generatePreRender(comp: CompDefinition, fragments: FragmentData[]) {
    const body = get(comp.sourceAstNode.arguments[0], 'body')
    const statements = get(body, 'statements') || [body];
    const modified = [
        ...addNamedFunctions(comp),
        ...parseStatements(comp, statements, fragments, true)
    ];
    return asMethod(comp, 'preRender', [], modified, false);
}

function assignFunctionNames(comp: CompDefinition) {
    comp.functions.forEach((func, i) => {
        writeFuncName(func, func.name || `lambda${i}`);
    });
}

function* addNamedFunctions(comp: CompDefinition) {
    const names = namedFuncs(comp);
    if (names.length) {
        yield asAst(`const  {${names.join(',')}}=this;`) as ts.Statement;
    }
}

const namedFuncs = (comp: CompDefinition) =>
    comp.functions.filter(f => f.name).map(f => f.name);

function parseStatements(comp: CompDefinition, statements: ts.Statement[], fragments: FragmentData[], isPreRender: boolean) {
    const declaredVars = new Set<string>();
    const parser = toTsxCompatible(comp, fragments, declaredVars, isPreRender);
    const s = statements.map(parser);
    if (isPreRender) {
        if (declaredVars.size) {
            s.splice(-1, 0, asAst(`this.volatile={${
                [...declaredVars, ...namedFuncs(comp)].join(',')
                }}`) as ts.Statement);
        }
    }
    return s.filter(s => !ts.isEmptyStatement(s));
}

function generateMethodBind(func: FuncDefinition) {
    const name = readFuncName(func);
    return cProperty(name,
        asAst(`(...args)=>this._${name}(...args)`) as ts.Expression
    );
}

const handleWhenFunc = (comp: CompDefinition, n: ts.Node, allowWhenFunc: boolean) => {
    if (ts.isExpressionStatement(n) &&
        ts.isCallExpression(n.expression)) {
        const call = n.expression;
        if (asCode(call.expression) === 'when') {
            if (allowWhenFunc) {
                const funcName = readNodeFuncName(call.arguments[1]);
                if (call.arguments.length !== 2 || !funcName) {
                    throw new Error(`Invalid "when" statement: must be called with 2 arguments: 
                    when(triggers:any|any[], callback:()=>void)`);
                }
                const vars = findUsedVariables(call, n => n === call.arguments[1]);
                delete vars.read.when;
                delete vars.accessed.when;
                const triggers = getChangeBitsNames(dependantOnVars(comp, vars));
                return asAst(`when(${JSON.stringify(triggers)}, this.${funcName})`);
            } else {
                throw new Error(`Invalid "when" statement: when should only be used component body (i.e. not in functions)`);
            }
        }
    }
    return undefined;
}

const swapLambdas = (n: ts.Node) => {
    if (ts.isFunctionExpression(n) || ts.isArrowFunction(n)) {
        return ts.createCall(
            ts.createPropertyAccess(
                ts.createThis(),
                ts.createIdentifier(readNodeFuncName(n))
            ),
            undefined,
            []
        )
    }
    return undefined;
};

export const toTsxCompatible = (comp: CompDefinition, fragments: FragmentData[], declaredVars?: Set<string>, allowWhenFunc: boolean = false) => {
    declaredVars = declaredVars || new Set<string>();
    const parser = (s: ts.Node, skipArrow?: any) => {
        const ret = cloneDeep<ts.Node, ts.Node>(s, undefined, n => {
            return swapVarDeclarations(comp, n, declaredVars!) ||
                swapLambdas(n) ||
                handleWhenFunc(comp, n, allowWhenFunc) ||
                swapStateChanges(comp, n) ||
                handleArrowFunc(parser, n, skipArrow) ||
                swapVirtualElements(comp, fragments, n);
        }) as ts.Statement;
        return ret;
    };
    return parser;
}

export const toFragSafe = (comp: CompDefinition, fragments: FragmentData[], exp: JsxExpression, allowNonFrags = false): ts.Expression =>
    cloneDeep(exp.sourceAstNode.expression!, undefined, n => swapVirtualElements(comp, fragments, n, allowNonFrags)) as ts.Expression

function handleArrowFunc(parser: (n: ts.Node, skipArrow: ts.Node) => ts.Node, n: ts.Node, skipArrow?: ts.Node) {
    if (n !== skipArrow && n.parent && ts.isArrowFunction(n.parent)) {
        return ts.createReturn(
            parser(n, n) as ts.Expression
        );
    }
    return undefined;
}

export function swapVirtualElements(comp: CompDefinition, fragments: FragmentData[], n: ts.Node, allowNonFrags = false): ts.Expression | undefined {
    if (ts.isParenthesizedExpression(n)) {
        return swapVirtualElements(comp, fragments, n.expression);
    }
    if (ts.isJsxElement(n) || ts.isJsxSelfClosingElement(n)) {
        const frag = safely(
            () => fragments.find(f => f.root.sourceAstNode === ((n as any)?.src || n)),
            `Unidentified Fragment Instance`, f => allowNonFrags || f)!;
        if (!frag || frag.isComponent) {
            const [i, c] = findJsxComp(comp, n);
            if (c) {
                const ret = asAst(`this.$${c.name}${i}`) as ts.Expression;
                return setNodeSrc(ret, n);
            }
        } else {
            const ret = asAst(`VirtualElement.fragment('${frag.index}', ${comp.name}.${frag.id}, this)`) as ts.Expression;
            return setNodeSrc(ret, n);
        }
    };
    return undefined;
}

export const findJsxComp = (comp: CompDefinition, node: ts.Node): [-1, null] | [number, JsxComponent] => {
    let compIndex = 0;
    for (const root of comp.jsxRoots) {
        for (const c of root.components) {
            if (c.sourceAstNode === ((node as any)?.src || node)) {
                return [compIndex, c];
            }
            compIndex++;
        }
    }
    return [-1, null];
}

function generateMethod(comp: CompDefinition, name: string, body: ts.Node, fragments: FragmentData[], args: string[]) {
    const statements = get(body, 'statements') || [body];
    const modified = [...parseStatements(comp, statements, fragments, false)];
    return asMethod(comp, name, args, modified);
}

const asMethod = (comp: CompDefinition, name: string, args: string[], statements: ts.Statement[], unpackVolatile = true) => cMethod(name, args, [
    ...setupClosure(comp, statements, unpackVolatile),
    ...statements])

const swapStateChanges = (comp: CompDefinition, n: ts.Node) => {
    if (ts.isExpressionStatement(n) && ts.isCallExpression(n.expression)) {
        return undefined;
    }
    const exp = (ts.isAsExpression(n) || ts.isExpressionStatement(n))
        ? n.expression
        : ((ts.isBinaryExpression(n) || ts.isPrefixUnaryExpression(n) || ts.isPostfixUnaryExpression(n)) && n)
    if (exp) {
        const used = findUsedVariables(exp);
        const changeBits: string[] = [];
        const usedStores: string[] = [];
        for (const [store, v] of Object.entries(used.modified || {})) {
            if (comp.stores.some(({ name }) => name === store)) {
                usedStores.push(store);
                Object.keys(v).forEach(field => changeBits.push(`${comp.name}.changesBitMap['${store}.${field}']`));
            }
        }
        return changeBits.length === 0
            ? undefined
            : asAst(`TSXAir.runtime.update(this, ${changeBits.join('|')}, ()=>${asCode(exp)})`) as ts.ExpressionStatement;
    }
    return undefined;
};

function swapVarDeclarations(comp: CompDefinition, n: ts.Node, declaredVars: Set<string>) {
    if (ts.isVariableStatement(n)) {
        const declarations = chain(n.declarationList.declarations).filter(declaration => {
            if (declaration.initializer) {
                return !(isStoreDefinition(comp, declaration) || isFunc(declaration))
            }
            return true;
        }).flatMap(declaration => {
            if (ts.isObjectBindingPattern(declaration.name)) {
                const bound = declaration.name.elements.filter(e => asCode(e.name) in comp.aggregatedVariables.accessed);
                bound.forEach(b => declaredVars.add(asCode(b.name)));
                return bound.length
                    ? ts.createVariableDeclaration(
                        ts.createObjectBindingPattern(bound), undefined,
                        declaration.initializer
                            ? declaration.initializer
                            : undefined
                    )
                    : []
            } else if (asCode(declaration.name) in comp.aggregatedVariables.accessed) {
                declaredVars.add(asCode(declaration.name));
                return declaration
            }
            return [];
        }).value();
        return declarations.length
            ? cloneDeep(
                ts.createVariableStatement(undefined, ts.createVariableDeclarationList(
                    declarations, n.declarationList.flags)))
            : ts.createEmptyStatement();
    }
    return undefined;
}

const isFunc = (v: ts.VariableDeclaration) => (v.initializer && (
    ts.isArrowFunction(v.initializer) ||
    ts.isFunctionExpression(v.initializer)));

export const asFunction = (method: ts.MethodDeclaration) =>
    cFunction(method.parameters.map(i => i), method.body!);

function isStoreDefinition(comp: CompDefinition, node: ts.Statement | ts.VariableDeclaration) {
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
