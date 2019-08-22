import { Stateful, ComponentInstance } from '../types/component';
import { PropsOf, StateOf, isStatefulFactory, isNonTrivialFactory, Factory, TrivialComponentFactory } from '../types/factory';
import { diff } from './utils';

type StateDiff<STATE> = [Stateful<any, STATE, any>, Partial<STATE>];
type PropsChange<PROPS> = [ComponentInstance<PROPS, any, any>, PROPS];

const maxViewUpdateIterations = 50;

const mappedDiff = (instance: ComponentInstance, map: Map<ComponentInstance, {}>, props: boolean) => {
    if (map.has(instance)) {
        return props
            ? diff(map.get(instance), instance.props, true)
            : diff(map.get(instance)!, (instance as Stateful<any, any, {}>).state, false);
    }
    return [];
};

export class Runtime {
    private pending: {
        props: Array<PropsChange<any>>,
        stateDiffs: Array<StateDiff<any>>
    } = { props: [], stateDiffs: [] };

    private viewUpdatePending: boolean = false;

    public updateState<Ctx, Props, State>(instance: Stateful<Ctx, Props, State>, stateDiff: Partial<State>) {
        this.pending.stateDiffs.push([instance, stateDiff]);
        this.triggerViewUpdate();
    }

    public updateProps<Ctx, Props, State>(instance: ComponentInstance<Ctx, Props, State>, newProps: Props) {
        this.pending.props.push([instance, newProps]);
        this.triggerViewUpdate();
    }

    public render<Component>(
        target: HTMLElement,
        factory: Factory<Component>,
        props: PropsOf<Component>,
        state?: StateOf<Component>
    ): Component | undefined {
        if (isNonTrivialFactory<Component>(factory)) {
            const safeState = isStatefulFactory<Component>(factory) ? state || factory.initialState(props) : undefined;
            target.innerHTML = factory.toString(props, safeState);
            const compHtml = target.children[0] as HTMLElement;
            return factory.hydrate(compHtml, props, safeState);
        } else {
            target.innerHTML = (factory as TrivialComponentFactory<Component>).toString();
            return;
        }
    }

    private updateViewOnce(props: Array<PropsChange<any>>,
        stateDiffs: Array<StateDiff<any>>) {

        const changed = new Set<ComponentInstance<any, any, any>>();

        // Update props first, as it may trigger state changes from a parent 
        const latestProps = new Map<ComponentInstance, {}>();
        props.forEach(([instance, newProps]) => {
            latestProps.set(instance, newProps);
            changed.add(instance);
        });
        const accStateDiff = new Map<Stateful, {}>();
        stateDiffs.forEach(([instance, d]) => {
            const aggregated = accStateDiff.has(instance) ? { ...accStateDiff.get(instance), ...d } : d;
            accStateDiff.set(instance, aggregated);
            changed.add(instance);
        });

        changed.forEach(i => {
            const instance = i as Stateful;
            const propsDiff = mappedDiff(instance, latestProps, true);
            const stateDiff = mappedDiff(instance, accStateDiff, false);
            if (propsDiff.length + stateDiff.length > 0) {
                instance.$beforeUpdate(latestProps.get(instance) || instance.props, accStateDiff.get(instance));
                if (propsDiff.length > 0) {
                    instance.$updateProps(propsDiff);
                    // @ts-ignore
                    instance.props = latestProps.get(instance);
                }
                if (stateDiff.length > 0) {
                    const delta = accStateDiff.get(instance)!;
                    instance.$updateState(stateDiff, delta);
                    // @ts-ignore
                    instance.state = { ...instance.state, ...delta };
                }
            }
        });
        return changed;
    }

    private updateView = () => {
        let count = 0;
        const changed = new Set<ComponentInstance>();
        do {
            if (count++ > maxViewUpdateIterations) {
                // Throw error or release thread, 
                // TODO: handle infinite loop over multiple frames
            }
            const { props, stateDiffs } = this.pending;
            this.pending = { props: [], stateDiffs: [] };
            this.updateViewOnce(props, stateDiffs).forEach(i => changed.add(i));
        } while (this.pending.props.length > 0);

        this.viewUpdatePending = false;

        if (changed.size > 0) {
            window.requestAnimationFrame(() => {
                changed.forEach(i => i.$afterUpdate());
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
