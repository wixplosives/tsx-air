import {
    CompDefinition,
    NodeWithVariables,
    cConst,
    cLet,
    UsedVariables,
    FuncDefinition,
    RecursiveMap
} from '@tsx-air/compiler-utils';
import ts from 'typescript';
import flatMap from 'lodash/flatMap';
import { VOLATILE, STATE } from '../consts';
import { merge, chain } from 'lodash';

export const getGenericMethodParams = (
    comp: CompDefinition,
    scope: UsedVariables,
    includeVolatile = false,
    deStructure = true
) => {
    const used = usedInScope(comp, scope);
    const retValue = (usedKeys: RecursiveMap | undefined, name: string) => {
        if (usedKeys && Object.keys(usedKeys).length) {
            return deStructure ? destructure(usedKeys) : name;
        }
        return undefined;
    };

    const volatile = includeVolatile ? retValue(used.volatile, VOLATILE) : undefined;
    const state = retValue(used.stores, STATE);
    const props = used.props ? comp.propsIdentifier : undefined;
    return [props, state, volatile];
};

export interface UsedInScope {
    props?: RecursiveMap;
    stores?: RecursiveMap;
    volatile?: RecursiveMap;
}

export  const compFuncByName = (comp:CompDefinition, name: string) => comp.functions.find(f => f.name === name);
     
export function usedInScope(comp: CompDefinition, scope: UsedVariables, separateFunctions = false): UsedInScope {
    const compFunction = (name:string) => compFuncByName(comp, name);
    const _usedInScope = (name: string) => (name in scope.accessed || name in scope.modified || name in scope.defined)
    && !(separateFunctions && compFunction(name));
    const used: UsedInScope = {};
    const add = (added: RecursiveMap, prefix: string) => {
        merge(used, { [prefix]: added });
    };

    comp.volatileVariables.filter(_usedInScope).forEach(v => add({ [v]: {} }, 'volatile'));

    if (comp.propsIdentifier && scope.read[comp.propsIdentifier]) {
        add({ [comp.propsIdentifier]: scope.read[comp.propsIdentifier] }, 'props');
    }
    comp.stores.forEach(({ name }) => {
        if (scope.accessed[name]) {
            add({ [name]: scope.accessed[name] }, 'stores');
        }
    });

    const addToResult = (func?: FuncDefinition) => {
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
                    const f = compFunction(name);
                    if (f) {
                        if (!separateFunctions) {
                            addToResult(f);
                        }
                    } else {
                        add({ [name]: {} }, 'volatile');
                    }
                });
        }
    };

    comp.volatileVariables.filter(_usedInScope).forEach(v => addToResult(compFunction(v)));
    return used;
}

export function getFlattened(rmap?: RecursiveMap): Set<string> {
    if (!rmap) {
        return new Set<string>();
    }
    return new Set(
        chain(rmap)
            .keys()
            .flatMap(k => {
                const keys = Object.keys(rmap[k]);
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
