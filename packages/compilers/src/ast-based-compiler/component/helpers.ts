import {
    CompDefinition,
    NodeWithVariables,
    cConst,
    cLet,
    UsedVariables,
    RecursiveMap,
    findUsedVariables,
    UsedInScope,
    asAst,
    JsxRoot,
    JsxExpression, UserCode, isCompDefinition, isHookDef
} from '@tsx-air/compiler-utils';
import ts from 'typescript';
import flatMap from 'lodash/flatMap';
import { merge, chain, defaultsDeep, mergeWith, omit } from 'lodash';
import isArray from 'lodash/isArray';
import { FragmentData } from './fragment/jsx.fragment';
import { readNodeFuncName } from './functions/names';
import { STORES, VOLATILE } from '../consts';

export const codeFuncByName = (code: UserCode, name: string) => code.functions.find(f => f.name === name);

export function getDirectDependencies(code: UserCode, scope: UsedVariables, ignoreFuncReferences: boolean): UsedInScope {
    const used: UsedInScope = {};
    const _usedInScope = (name?: string) =>
        (name && (name in scope.accessed || name in scope.executed)
            && !(ignoreFuncReferences && code.functions.some(f => f.name === name)));

    code.volatileVariables.filter(_usedInScope).forEach(v =>
        add(used, { [v]: scope.accessed[v] }, VOLATILE));

    if (isCompDefinition(code) && _usedInScope(code.propsIdentifier)) {
        add(used, { $props: scope.read[code.propsIdentifier!] }, STORES);
    }

    code.stores.map(c => c.name).filter(_usedInScope).forEach(
        name => add(used, { [name]: scope.accessed[name] }, STORES)
    );

    scope.executed.$refs?.forEach(ref => {
        const name = readNodeFuncName(ref);
        if (name) {
            add(used, { [name]: {} }, VOLATILE);
        }
    });
    return used;
}

type U<T> = UsedInScope<T> | UsedVariables<T> | RecursiveMap<T>;
export function mergeRefMap<T, R extends U<T>>(obj: R, ...newUsed: R[]): R {
    newUsed.forEach(added => mergeWith(obj, added, (a, b) => {
        if (isArray(a)) {
            return chain(a).concat(b).uniq().value();
        } else { return; }
    }));
    return obj as R;
}


const add = (target: UsedInScope, added: RecursiveMap, prefix: string) => {
    mergeWith(target, { [prefix]: added }, (a, b) => {
        if (isArray(a)) {
            return chain(a).concat(b).uniq().value();
        } else { return; }
    });
};

const addAll = (comp: CompDefinition, target: UsedInScope, usedVars: UsedVariables) => {
    const merged = defaultsDeep({}, ...Object.values(usedVars));
    for (const [k, v] of Object.entries(merged)) {
        if (k === comp.propsIdentifier) {
            add(target, { $props: v as RecursiveMap }, 'stores');
        } else {
            if (!comp.stores.some(({ name }) => {
                if (name === k) {
                    add(target, { [name]: merged[name] }, 'stores');
                    return true;
                }
                return false;
            })) {
                add(target, { [k]: v as RecursiveMap }, 'volatile');
            }
        }
    }
};

function expandDependencies(comp: CompDefinition, scope: UsedVariables, name: string): UsedVariables {
    const func = comp.functions.find(f => f.name === name);
    if (func) {
        return {
            read: omit(func.aggregatedVariables.read, Object.keys(func.aggregatedVariables.defined)),
            accessed: omit(func.aggregatedVariables.read, Object.keys(func.aggregatedVariables.defined)),
            defined: {},
            modified: {},
            executed: func.aggregatedVariables.executed
        } as UsedVariables;
    }

    const changed = merge({}, scope.modified[name], scope.defined[name]).$refs || [];
    const refs: UsedVariables = { accessed: {}, read: {}, modified: {}, executed: {}, defined: {} };
    changed.forEach(ref => {
        const found = findUsedVariables(ref);
        mergeWith(refs.read, found.read, (a, b) =>
            isArray(a) ? chain(a).concat(b).uniq().value() : undefined);
    });
    refs.accessed = refs.read;
    return refs;
}

export function dependantOnVars(comp: CompDefinition, scope: UsedVariables, ignoreFuncReferences = false) {
    const flat = getDirectDependencies(comp, scope, ignoreFuncReferences);
    const toBeExpanded = Object.keys(flat.volatile || {});
    while (toBeExpanded.length) {
        const newRefs = expandDependencies(comp, comp.variables, toBeExpanded.pop()!);
        Object.keys(newRefs.read).forEach(k => {
            if (!flat.volatile![k] && comp.propsIdentifier !== k && !comp.stores.some(({ name }) => name === k)) {
                toBeExpanded.push(k);
            }
        });
        addAll(comp, flat, newRefs);
    }
    return flat;
}

function* getClosureVolatile(code: UserCode, used: UsedInScope, storesTarget: string) {
    const res = merge({}, used.stores, used.volatile);
    if (used.props) {
        res.$props = {};
    }
    // if ()
    // if (used.stores) {
    //     yield cConst(destructure(used.stores,
    //         isCompDefinition(code) ? { $props: code.propsIdentifier } : {})!,
    //         asAst(`${storesTarget}.volatile`) as ts.PropertyAccessExpression);
    // }
    if (used.stores || used.volatile || used.props) {
        yield cLet(destructure(res,
            isCompDefinition(code)
                ? { $props: code.propsIdentifier }
                : {})!,
            asAst(`${storesTarget}.volatile`) as ts.PropertyAccessExpression);
    }
}

function* getClosureProps(code: UserCode, used: UsedInScope, storesTarget: string) {
    if (isCompDefinition(code)) {
        if (used?.stores?.$props) {
            if (code.propsIdentifier) {
                yield cConst(code.propsIdentifier, ts.createIdentifier(`${storesTarget}.stores.$props`));
            } else {
                throw new Error(`Invalid props usage: props identifier not found`);
            }
        }
    }
    // if( isHookDef())
}

export function* setupClosure(code: UserCode, scope: ts.Node[] | UsedVariables, isUserCode = false, storesTarget = 'this') {
    const f = ((isArray(scope) ? scope : [scope]) as ts.Node[]).map(s =>
        // @ts-ignore: handle UsedVariables scope
        (s.read && s.accessed)
            ? s
            : findUsedVariables(s));
    const used = merge({ read: {}, accessed: {}, modified: {}, executed: {}, defined: {} }, ...f);
    Object.keys(used.defined).forEach(k => {
        delete used.read[k];
        delete used.accessed[k];
    });
    yield* destructureParams(code, used);

    yield* addToClosure(code, getDirectDependencies(code, used, false), isUserCode, storesTarget);
    // if (!isUserCode) {
    //     yield* addToClosure(code, Object.keys(used.executed).filter(
    //         name => code.functions.some(fn => fn.name === name)
    //     ), false, storesTarget);
    // }
}

export function* addToClosure(code: UserCode, used: UsedInScope, isUserCode: boolean, storesTarget: string) {
    if (!isUserCode) {
        yield* getClosureVolatile(code, used, storesTarget);
    } else {
        yield* getClosureProps(code, used, storesTarget);
    }
}

function* destructureParams(code: UserCode, used: UsedVariables) {
    if (isHookDef(code)) {
        const args = code.parameters.map(p => p.name);
        if (args.length && args.some(a =>
            used.accessed[a])) {
            yield asAst(`const [${args.join(',')}] = this.stores.$props`) as ts.Statement;
        }
    }
}

const destructureNamed = (keys: string[], rename: Record<string, string | undefined>) => ts.createObjectBindingPattern(
    keys.map(key =>
        ts.createBindingElement(undefined,
            rename[key] ? key : undefined,
            ts.createIdentifier(rename[key] ? rename[key]! : key),
            undefined)
    )
);

const destructure = (map: RecursiveMap, rename: Record<string, string | undefined> = {}) =>
    map && Object.keys(map).length
        ? destructureNamed(Object.keys(map), rename)
        : undefined;

const readNsVars = (comp: NodeWithVariables, namespace: string | undefined) => {
    if (namespace && comp.aggregatedVariables.read[namespace]) {
        return Object.keys(comp.aggregatedVariables.read[namespace]).map(key => `${namespace}.${key}`);
    }
    return [];
};

export const readVars = (comp: CompDefinition) => {
    const props = readNsVars(comp, comp.propsIdentifier);
    const stores = flatMap(comp.stores, store => readNsVars(comp, store.name));
    return [...props, ...stores];
};

export function getDirectExpressions(root: JsxRoot) {
    const directExp = new Set<string>(root.expressions.map(e => e.expression));

    const removeInner = (exp: JsxExpression) => {
        exp.jsxRoots.forEach(r =>
            r.expressions.forEach(ex => {
                directExp.delete(ex.expression);
                removeInner(ex);
            })
        );
    };
    root.expressions.forEach(removeInner);
    return root.expressions.filter(e => directExp.has(e.expression));
}

export function getRecursiveMapPaths(map: RecursiveMap) {
    const res: string[] = [];
    const dfs = (r: RecursiveMap, prefix = '') => {
        let count = 0;
        for (const [key, value] of Object.entries(r)) {
            if (key !== '$refs') {
                count++;
                dfs(value, prefix ? `${prefix}.${key}` : key);
            }
        }
        if (count === 0 && prefix !== '') {
            res.push(prefix);
        }
    };
    dfs(map);
    return res;
}

export const isAttribute = (exp: JsxExpression) => ts.isJsxAttribute(exp.sourceAstNode.parent);
export const jsxExp = (fragment: FragmentData) => getDirectExpressions(fragment.root).filter(e => !isAttribute(e));
export const dynamicAttributes = (fragment: FragmentData) => getDirectExpressions(fragment.root).filter(isAttribute);
export const attrElement = (attr: JsxExpression) => attr.sourceAstNode.parent.parent.parent as ts.JsxOpeningLikeElement;
