import {
    CompDefinition,
    NodeWithVariables,
    cConst,
    cLet,
    UsedVariables,
    RecursiveMap,
    findUsedVariables,
    UsedInScope
} from '@tsx-air/compiler-utils';
import ts from 'typescript';
import flatMap from 'lodash/flatMap';
import { VOLATILE, STATE } from '../consts';
import { merge, chain, defaultsDeep } from 'lodash';

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

export function dependantOnVars(comp: CompDefinition, scope: UsedVariables, ignoreFuncReferences = false): UsedInScope {
    const compFunction = (name: string) => compFuncByName(comp, name);
    const _usedInScope = (name: string) => (name in scope.accessed || name in scope.modified || name in scope.defined)
        && !(ignoreFuncReferences && compFunction(name));
    const used: UsedInScope = {};

    const add = (added: RecursiveMap, prefix: string) => {
        merge(used, { [prefix]: added });
    };
    const addAll = (usedVars: UsedVariables) => {
        const merged = defaultsDeep({}, ...Object.values(usedVars));
        for (const [k, v] of Object.entries(merged)) {
            if (k === comp.propsIdentifier) {
                add({ [k]: v as RecursiveMap }, 'props');
            } else {
                if (!comp.stores.some(({ name }) => {
                    if (merged[name]) {
                        add({ [name]: merged[name] }, 'stores');
                        return true;
                    }
                    return false;
                })) {
                    add({ [k]: {} }, 'volatile');
                };
            }
        }
    }

    comp.volatileVariables.filter(_usedInScope).forEach(v => add({ [v]: scope.accessed[v] }, 'volatile'));

    if (comp.propsIdentifier && scope.read[comp.propsIdentifier]) {
        add({ [comp.propsIdentifier]: scope.read[comp.propsIdentifier] }, 'props');
    }
    comp.stores.forEach(({ name }) => {
        if (scope.read[name]) {
            add({ [name]: scope.accessed[name] }, 'stores');
        }
    });

    const addToResult = (funcNames: string[]) => {
        funcNames.map(compFunction).forEach(func => {
            if (func) {
                const usedInFunc = func.aggregatedVariables.read;
                if (comp.propsIdentifier && usedInFunc[comp.propsIdentifier]) {
                    add({ [comp.propsIdentifier]: usedInFunc[comp.propsIdentifier] }, 'props');
                }
                comp.stores
                    .filter(({ name }) => usedInFunc[name])
                    .forEach(({ name }) => {
                        add({ [name]: usedInFunc[name] }, 'stores');
                    });
                comp.volatileVariables
                    .filter(v => usedInFunc[v])
                    .forEach(name => {
                        if (compFunction(name)) {
                            if (!ignoreFuncReferences) {
                                addToResult([name]);
                            }
                        } else {
                            add({ [name]: usedInFunc[name] }, 'volatile');
                        }
                    });
            }
        });
    };

    addToResult(comp.volatileVariables.filter(_usedInScope));

    chain(used.volatile).keys().forEach(k => {
        const refs: UsedVariables = { accessed: {}, read: {}, modified: {}, executed: {}, defined: {} };
        if (comp.variables.modified[k]) {
            comp.variables.modified[k].$refs?.forEach(r => {
                const found = findUsedVariables(r);
                merge(refs.read, found.read);
                addToResult(Object.keys(found.executed));
            });

        }
        if (comp.variables.defined[k]) {
            comp.variables.defined[k].$refs?.forEach(r => {
                const found = findUsedVariables(r);
                merge(refs.read, found.read);
                addToResult(Object.keys(found.executed));
            });
        }
        addAll(refs)
    }).value();
    return used;
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
