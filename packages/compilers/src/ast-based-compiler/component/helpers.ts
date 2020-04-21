import { CompDefinition, NodeWithVariables, cConst, cLet, UsedVariables, StoreDefinition, FuncDefinition } from '@tsx-air/compiler-utils';
import ts from 'typescript';
import flatMap from 'lodash/flatMap';
import { VOLATILE, STATE } from '../consts';

export const getGenericMethodParams = (comp: CompDefinition,
    scope: UsedVariables,
    includeVolatile = false,
    deStructure = true,
) => {
    const used = usedInScope(comp, scope);
    const retValue = (usedKeys: Set<string>, name: string) => {
        if (usedKeys.size) {
            return deStructure ? destructure(usedKeys) : name;
        }
        return undefined;
    };

    const volatile = includeVolatile
        ? retValue(used.volatile, VOLATILE)
        : undefined;
    const state = retValue(used.stores, STATE);
    const props = retValue(used.props, comp.propsIdentifier!);
    return [props, state, volatile];
};

function usedInScope(comp: CompDefinition, scope?: UsedVariables, _originalScope?: UsedVariables) {
    scope = scope ? scope! : comp.aggregatedVariables;
    const _usedInScope = (name: string) =>
        name in (_originalScope || scope)!.accessed
        || name in scope!.modified
        || name in scope!.defined;

    const props = new Set<string>(
        comp.propsIdentifier && scope.accessed[comp.propsIdentifier]
            ? [comp.propsIdentifier]
            : []);
    const stores = new Set<string>(comp.stores.filter(({ name }) => _usedInScope(name)).map(s => s.name));
    const volatile = new Set<string>(comp.volatileVariables.filter(_usedInScope));

    const compFunction = (name: string) => comp.functions.find(f => f.name === name);
    const addToResult = (func?: FuncDefinition) => {
        if (func) {
            const usedInFunc = func.aggregatedVariables.read;
            if (comp.propsIdentifier && usedInFunc[comp.propsIdentifier]) {
                props.add(comp.propsIdentifier);
            }
            comp.stores.filter(({ name }) => usedInFunc[name]).forEach(s => stores.add(s.name));
            comp.volatileVariables.filter(v => usedInFunc[v]).forEach(name => {
                const f = compFunction(name);
                if (f) {
                    addToResult(f);
                } else {
                    volatile.add(name);
                }
            });            
        }
    };

    volatile.forEach(v => addToResult(compFunction(v)));

    return {
        props, stores, volatile
    };
}

export function destructureState(comp: CompDefinition, scope: UsedVariables) {
    const used = usedInScope(comp, scope);
    return (used.stores.size) ?
        cConst(
            destructure(used.stores)!,
            ts.createIdentifier(STATE))
        : undefined;
}

export function destructureVolatile(comp: CompDefinition, scope: UsedVariables) {
    const used = usedInScope(comp, scope);
    return (used.volatile.size)
        ? cLet(
            destructure(used.volatile)!,
            ts.createIdentifier(VOLATILE))
        : undefined;
}


const destructure = (keys: Set<string>) =>
    keys.size ? ts.createObjectBindingPattern(
        [...keys].map(key =>
            ts.createBindingElement(
                undefined,
                undefined,
                ts.createIdentifier(key),
                undefined
            ))
    ) : undefined;


const readNsVars =
    (comp: NodeWithVariables, namespace: string | undefined) => {
        if (namespace && comp.aggregatedVariables.read[namespace]) {
            return Object.keys(comp.aggregatedVariables.read[namespace]).map(key => `${namespace}.${key}`);
        }
        return [];
    };

export const readVars = (comp: CompDefinition) => {
    const props = readNsVars(comp, comp.propsIdentifier);
    const stores = flatMap(comp.stores, store =>
        readNsVars(comp, store.name));
    return [...props, ...stores];
};

