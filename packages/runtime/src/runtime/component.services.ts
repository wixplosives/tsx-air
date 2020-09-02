import { Component, Runtime } from '..';
export class ComponentServices {
    private previousPredicates = new Map<Component, Record<number, false|any[]>>();
    private previousValue = new Map<Component, Record<number, any>>();

    constructor(readonly runtime: Runtime) { }

    when = (target: Component, id: number, action: () => void, predicate: any) =>
        this.doIfPredicate(target, id, action, predicate, true);

    memo = (target: Component, id: number, action: () => void, predicate: any) =>
        this.doIfPredicate(target, id, action, predicate, false);

    afterDomUpdate = (target: Component, id: number, action: () => void, predicate: any) =>
        this.doIfPredicate(target, id,
            () => target.$afterDomUpdate.push(action)
            , predicate, false);

    private doIfPredicate(target: Component, id: number, action: () => void, predicate: false|any[], useUndo: boolean) {
        const previousTargetPredicates = this.previousPredicates.get(target) || {};
        const previousTargetValue = this.previousValue.get(target) || {};
        const ret = () => useUndo ? void (0) : previousTargetValue[id];

        const update = () => {
            this.previousPredicates.set(target, previousTargetPredicates);
            previousTargetPredicates[id] = predicate;
            previousTargetValue[id] = action();
        };

        if (predicate && this.previousPredicates.has(target)
            // Undefined predicate will always trigger the action 
            && previousTargetPredicates[id] !== undefined) {
            const previous = previousTargetPredicates[id];

            if (previous && previous.length === predicate.length &&
                previous.every((v, i) => v === predicate[i])) {
                return ret();
            }
        }
        if (useUndo && previousTargetValue[id]) {
            previousTargetValue[id]();
        }
        update();
        return ret();
    }
}