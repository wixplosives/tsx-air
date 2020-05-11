import {
    CompDefinition,
    NodeWithVariables,
    cConst,
    cLet,
    UsedVariables,
    RecursiveMap,
    findUsedVariables,
    UsedInScope,
} from '@tsx-air/compiler-utils';
import ts from 'typescript';
import flatMap from 'lodash/flatMap';
import { VOLATILE, STATE } from '../consts';
import { merge, chain, defaultsDeep, mergeWith, omit } from 'lodash';
import isArray from 'lodash/isArray';

export const getGenericMethodParamsByUsedInScope = (used: UsedInScope, includeVolatile = false,
    deStructure = true) => {
    const retValue = (usedKeys: RecursiveMap | undefined, name: string) => {
        if (usedKeys && Object.keys(usedKeys).length) {
            return deStructure ? destructure(usedKeys) : name;
        }
        return undefined;
    };

    const volatile = includeVolatile ? retValue(used.volatile, VOLATILE) : undefined;
    const state = retValue(used.stores, STATE);
    const props = chain(used.props).keys().first().value();
    return [props, state, volatile];
}

export const getGenericMethodParams = (
    comp: CompDefinition,
    scope: UsedVariables,
    includeVolatile = false,
    deStructure = true
) => {
    const used = dependantOnVars(comp, scope);
    return getGenericMethodParamsByUsedInScope(used, includeVolatile, deStructure);
};

export const compFuncByName = (comp: CompDefinition, name: string) => comp.functions.find(f => f.name === name);

function getDirectDependencies(comp: CompDefinition, scope: UsedVariables, ignoreFuncReferences:boolean): UsedInScope {
    const used: UsedInScope = {};
    const _usedInScope = (name?: string) => 
        name && name in scope.read 
        && !(ignoreFuncReferences && comp.functions.some(f => f.name === name));

    comp.volatileVariables.filter(_usedInScope).forEach(v => 
        add(used, { [v]: scope.accessed[v] }, 'volatile'));

    if (_usedInScope(comp.propsIdentifier)) {
        add(used, { [comp.propsIdentifier!]: scope.read[comp.propsIdentifier!] }, 'props');
    }

    comp.stores.map(c => c.name).filter(_usedInScope).forEach(
        name => add(used, { [name]: scope.accessed[name] }, 'stores')
    );
    
    return used;
}

const add = (target:UsedInScope, added: RecursiveMap, prefix: string) => {
    mergeWith(target, { [prefix]: added }, (a, b) => {
        if (isArray(a)) {
            return chain(a).concat(b).uniq().value();
        } else return;
    });
};

const addAll = (comp:CompDefinition, target:UsedInScope, usedVars: UsedVariables) => {
    const merged = defaultsDeep({}, ...Object.values(usedVars));
    for (const [k, v] of Object.entries(merged)) {
        if (k === comp.propsIdentifier) {
            add(target, { [k]: v as RecursiveMap }, 'props');
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

function expandDependencies(comp:CompDefinition, scope: UsedVariables, name: string):UsedVariables {
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
        mergeWith(refs.read, found.read, (a, b) => {
            if (isArray(a)) {
                return chain(a).concat(b).uniq().value();
            } else return;
        });
    });
    return refs;
}

export function dependantOnVars(comp: CompDefinition, scope: UsedVariables, ignoreFuncReferences = false) {
    const flat = getDirectDependencies(comp, scope, ignoreFuncReferences);
    const toBeExpanded = Object.keys(flat.volatile || {});
    while (toBeExpanded.length) {
        const newRefs = expandDependencies(comp, comp.variables, toBeExpanded.pop()!);
        Object.keys(newRefs.read).forEach(k => {
            if (!flat.volatile![k] && comp.propsIdentifier !== k && !comp.stores.some(({name}) => name === k)) {
                toBeExpanded.push(k)
            }
        });
        addAll(comp, flat, newRefs);
    }
    return flat;
}

export function getFlattened(recursiveMap?: RecursiveMap): Set<string> {
    if (!recursiveMap) {
        return new Set<string>();
    }
    return new Set(
        chain(recursiveMap)
            .keys()
            .flatMap(k => {
                const keys = Object.keys(recursiveMap[k]);
                if (keys.length) {
                    return keys.map(ik => `${k}.${ik}`);
                } else {
                    return k;
                }
            })
            .value()
    );
}

export function destructureState(used: UsedInScope) {
    return used.stores ? cConst(destructure(used.stores)!, ts.createIdentifier(STATE)) : undefined;
}

export function destructureVolatile(used: UsedInScope) {
    return used.volatile ? cLet(destructure(used.volatile)!, ts.createIdentifier(VOLATILE)) : undefined;
}

const destructure = (map: RecursiveMap) =>
    map && Object.keys(map).length
        ? ts.createObjectBindingPattern(
            Object.keys(map).map(key =>
                ts.createBindingElement(undefined, undefined, ts.createIdentifier(key), undefined)
            )
        )
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
