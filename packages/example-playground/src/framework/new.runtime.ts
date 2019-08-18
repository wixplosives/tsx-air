import { Compiled, TrivialComponentFactory, StatelessComponentFactory, StatefulComponentFactory, isStateful, isNonTrivial, StatefulInstance, StatelessInstance, ComponentInstance, isStatefulInstance, TsxAirNode } from './framework-types';

type StateDiff<STATE> = [StatefulInstance<any, STATE, any>, Partial<STATE>];
type PropsChange<PROPS> = [ComponentInstance<PROPS, any, any>, PROPS];

const maxViewUpdateIterations = 50;

export class Runtime {
    private pending: {
        props: Array<PropsChange<any>>,
        stateDiffs: Array<StateDiff<any>>
    } = { props: [], stateDiffs: [] };

    private viewUpdatePending: boolean = false;

    public createElement<PROPS>(el: TsxAirNode<PROPS>) {
        return el as TsxAirNode<PROPS>;
    }

    public updateState<STATE>(instance: StatefulInstance<any, any, STATE>, diff: Partial<STATE>) {
        this.pending.stateDiffs.push([instance, diff]);
        this.triggerViewUpdate();
    }

    public updateProps<PROPS>(instance: ComponentInstance<any, PROPS, any>, newProps: PROPS) {
        this.pending.props.push([instance, newProps]);
        this.triggerViewUpdate();
    }

    public render(target: HTMLElement, factory: TrivialComponentFactory): null;
    public render<PROPS, CTX>(target: HTMLElement, factory: StatelessComponentFactory<CTX, PROPS>, props: PROPS): StatelessInstance<CTX, PROPS>;
    public render<PROPS, STATE, CTX>(target: HTMLElement, factory: StatefulComponentFactory<CTX, PROPS, STATE>, props: PROPS): StatefulInstance<CTX, PROPS, STATE>;
    public render<PROPS, STATE, CTX>(target: HTMLElement, factory: Compiled<CTX, PROPS, STATE>, props?: PROPS, state?: STATE) {
        props = props!;
        state = isStateful(factory) ? state || factory.initialState(props) : undefined;
        target.innerHTML = factory.toString(props, state);
        return isNonTrivial(factory) ? factory.hydrate(target, props, state!) : null;
    }

    private updateViewOnce(props: Array<PropsChange<any>>,
        stateDiffs: Array<StateDiff<any>>) {

        const changed = new Set<ComponentInstance<any, any, any>>();

        // Update props first, as it may trigger state changes from a parent 
        const latestProps = new Map<ComponentInstance<any, any, any>, {}>();
        props.forEach(([instance, newProps]) => {
            latestProps.set(instance, newProps);
            changed.add(instance);
        });
        for (const [instance, newProps] of latestProps) {
            isStatefulInstance(instance)
                ? instance._beforeUpdate(newProps, instance.state)
                : instance._beforeUpdate(newProps);
            instance._updateProps(props);
        }

        const aggregatedDiffs = new Map<StatefulInstance<any, any, any>, {}>();
        stateDiffs.forEach(([instance, diff]) => {
            const aggregated = aggregatedDiffs.has(instance) ? { ...aggregatedDiffs.get(instance), ...diff } : diff;
            aggregatedDiffs.set(instance, aggregated);
            changed.add(instance);
        });
        for (const [instance, diff] of aggregatedDiffs) {
            instance._beforeUpdate(instance.props, diff);
            instance._updateState(diff);
        }

        return changed;
    }

    private updateView = () => {
        let count = 0;
        const changed = new Set<ComponentInstance<any, any, any>>();
        do {
            if (count++ > maxViewUpdateIterations) {
                // Throw error or release thread
            }
            const { props, stateDiffs } = this.pending;
            this.pending = { props: [], stateDiffs: [] };
            this.updateViewOnce(props, stateDiffs).forEach(changed.add);
        } while (this.pending.props.length > 0);

        this.viewUpdatePending = false;

        if (changed.size > 0) {
            window.requestAnimationFrame(() => {
                changed.forEach(i => i._afterUpdate());
            });
        }
    };

    private triggerViewUpdate() {
        if (!this.viewUpdatePending) {
            this.viewUpdatePending = true;
            window.requestAnimationFrame(this.updateView);
        }
    }
}

export default new Runtime();