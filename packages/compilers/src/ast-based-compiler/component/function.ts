import { findUsedVariables, CompDefinition, FuncDefinition, cloneDeep, cMethod, asCode, cProperty, asAst, cFunction, JsxComponent } from '@tsx-air/compiler-utils';
import ts from 'typescript';
import { setupClosure } from './helpers';
import { postAnalysisData } from '../../common/post.analysis.data';
import { FragmentData } from './fragment/jsx.fragment';
import { safely } from '@tsx-air/utils';

export function nameFunctions(comp: CompDefinition) {
    for (const func of comp.functions) {
        writeFuncName(func, func.name || nextLambdaName(comp));
    }
}

export function aggregateDependencies(comp: CompDefinition) {
    return comp.aggregatedVariables;
}

export function* generateMethods(comp: CompDefinition, fragments: FragmentData[]) {
    nameFunctions(comp);
    for (const func of comp.functions) {
        yield generateStateAwareMethod(comp, func, fragments);
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

export function generateStateAwareMethod(comp: CompDefinition, func: FuncDefinition, fragments: FragmentData[]) {
    const { sourceAstNode: src } = func;
    const name = `_${readFuncName(func)}`;
    const statements = (ts.isBlock(src.body)
        ? src.body.statements
        : [src.body]) as ts.Expression[];

    return cMethod(name, func.arguments, [
        ...setupClosure(comp, func.aggregatedVariables),
        ...statements.map(toTsxCompatible(comp, fragments))
    ]);
}

export const toTsxCompatible = (comp: CompDefinition, fragments: FragmentData[]) => (s: ts.Node) => {
    if (isStoreDefinition(comp, s as ts.Statement)) {
        throw new Error('stores may only be declared in the main component body');
    }
    return cloneDeep<ts.Node, ts.Node>(s, undefined, n => {
        if (ts.isExpressionStatement(n)) {
            return cStateCall(comp, n.expression);
        }
        if (n.parent && ts.isArrowFunction(n.parent)) {
            return ts.createReturn(n as ts.Expression);
        }
        if (ts.isJsxElement(n) || ts.isJsxSelfClosingElement(n)) {
            const frag = safely(
                () => fragments.find(f => f.root.sourceAstNode === ((n as any)?.src || n)),
                `Unidentified Fragment Instance`, f => !!f)!;
            if (frag.isComponent) {
                const [i, c] = findJsxComp(comp, n);
                return asAst(`this.$${c.name}${i}`);
            } else {
                return asAst(`VirtualElement.fragment('${frag.index}', ${comp.name}.${frag.id}, this)`);
            }
        };
        return undefined;
    }) as ts.Statement;
};

export const findJsxComp = (comp: CompDefinition, node: ts.Node): [number, JsxComponent] => {
    let compIndex = 0;
    for (const root of comp.jsxRoots) {
        for (const c of root.components) {
            if (c.sourceAstNode === ((node as any)?.src || node)) {
                return [compIndex, c];
            }
            compIndex++;
        }
    }
    throw new Error(`Unable to find analyzed component`);
}

export const nextLambdaName = (comp: CompDefinition) =>
    'lambda' + postAnalysisData.write(comp, 'lambdaCount', i => i ? i++ : 0);

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
