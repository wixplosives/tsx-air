import { CompDefinition, NodeWithVariables, cConst, cLet, UsedVariables } from '@tsx-air/compiler-utils';
import ts from 'typescript';
import flatMap from 'lodash/flatMap';

export const getGenericMethodParams = (comp: CompDefinition,
    scope: UsedVariables,
    includeVolatile = false,
    deStructure = true,
) => {
    const used = usedInScope(comp, scope);
    const retValue = (usedKeys: string[], name: string) => {
        if (usedKeys.length) {
            return deStructure ? destructure(usedKeys) : name;
        }
        return undefined;
    };

    const volatile = includeVolatile
        ? retValue(used.volatile, 'volatile')
        : undefined;
    const state = retValue(used.stores.map(s => s.name), 'state');
    return [used.props, state, volatile];
};

function usedInScope(comp: CompDefinition, scope?: UsedVariables) {
    scope = scope ? scope! :comp.aggregatedVariables ;
    const _usedInScope = (name: string) =>
        name in scope!.accessed
        || name in scope!.modified
        || name in scope!.defined;

    const props = comp.propsIdentifier && scope.accessed[comp.propsIdentifier]
        ? comp.propsIdentifier
        : undefined;
    const stores = comp.stores.filter(({ name }) => _usedInScope(name));
    const volatile = comp.volatileVariables.filter(_usedInScope);
    return { props, stores, volatile };
}

export function* destructureStateAndVolatile(comp: CompDefinition, scope: UsedVariables) {
    const used = usedInScope(comp, scope);
    if (used.stores.length) {
        yield cConst(
            destructure(used.stores.map(i => i.name))!,
            ts.createIdentifier('state'));
    }
    if (used.volatile.length) {
        yield cLet(
            destructure(used.volatile)!,
            ts.createIdentifier('volatile'));
    }
}

const destructure = (keys: string[]) =>
    keys.length ? ts.createObjectBindingPattern(
        keys.map(key =>
            ts.createBindingElement(
                undefined,
                undefined,
                ts.createIdentifier(key),
                undefined
            ))
    ) : undefined;


const accessedNsVars =
    (comp: NodeWithVariables, namespace: string | undefined) => {
        if (namespace && comp.aggregatedVariables.accessed[namespace]) {
            return Object.keys(comp.aggregatedVariables.accessed[namespace]).map(key => `${namespace}.${key}`);
        }
        return [];
    };

export const accessedVars = (comp: CompDefinition) => {
    const props = accessedNsVars(comp, comp.propsIdentifier);
    const stores = flatMap(comp.stores, store =>
        accessedNsVars(comp, store.name));
    return [...props, ...stores];
};

