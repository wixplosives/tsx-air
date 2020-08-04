import { Component, VirtualElement, ExpressionDom, Runtime } from '..';
import isArray from 'lodash/isArray';

export class ComponentServices {
    private previousPredicates = new Map<Component, Record<number, any>>();
    private previousValue = new Map<Component, Record<number, any>>();

    constructor(readonly runtime: Runtime) { }

    when = (predicate: any, action: () => void, target: Component, id: number) =>
        this.doIfPredicate(predicate, action, target, id, true);

    memo = (predicate: any, action: () => void, target: Component, id: number) =>
        this.doIfPredicate(predicate, action, target, id, false);



    private doIfPredicate(predicate: any, action: () => void, target: Component, id: number, useUndo: boolean) {
        const previousTargetPredicates = this.previousPredicates.get(target) || {};
        const previousTargetValue = this.previousValue.get(target) || {};
        const ret = () => useUndo ? void (0) : previousTargetValue[id];

        const update = () => {
            this.previousPredicates.set(target, previousTargetPredicates);
            previousTargetPredicates[id] = predicate;
            return previousTargetValue[id] = action();
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
        if (useUndo && ret()) {
            ret()();
        }
        return update();
    }
}