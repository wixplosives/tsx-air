import { Component, Runtime } from '..';
import isArray from 'lodash/isArray';

export class ComponentServices {
    private previousPredicates = new Map<Component, Record<number, any>>();
    private previousValue = new Map<Component, Record<number, any>>();

    constructor(readonly runtime: Runtime) { }

    when = (target: Component, id: number, action: () => void, predicate: any) =>
        this.doIfPredicate(target, id,  action,predicate,  true);

    memo = (target: Component, id: number, action: () => void, predicate: any) =>
        this.doIfPredicate(target, id,  action,predicate,  false);

    private doIfPredicate(target: Component, id: number, action: () => void, predicate: any, useUndo: boolean) {
        const previousTargetPredicates = this.previousPredicates.get(target) || {};
        const previousTargetValue = this.previousValue.get(target) || {};
        const ret = () => useUndo ? void (0) : previousTargetValue[id];

        const update = () => {
            this.previousPredicates.set(target, previousTargetPredicates);
            previousTargetPredicates[id] = predicate;
            previousTargetValue[id] = action();
        };

        if (this.previousPredicates.has(target) && id in previousTargetPredicates) {
            const previous = previousTargetPredicates[id];
            if (previous === predicate) {
                return ret();
            }
            if (isArray(previous)) {
                if (previous.length === predicate.length &&
                    previous.every((v, i) => v === predicate[i])) {
                    return ret();
                }
            }
        }
        if (useUndo && previousTargetValue[id]) {
            previousTargetValue[id]();
        }
        update();
        return ret();
    }
}