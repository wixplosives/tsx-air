import { Stateful, ComponentInstance, isStatefulInstance } from '../types/component';
import { PropsOf, StateOf, isStatefulFactory, isNonTrivialFactory, Factory, TrivialComponentFactory } from '../types/factory';
import { diff } from './utils';

type StateDiff<STATE> = [Stateful<any, STATE, any>, Partial<STATE>];
type PropsChange<PROPS> = [ComponentInstance<PROPS, any, any>, PROPS];

const maxViewUpdateIterations = 50;

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
            const instance: Component = factory.hydrate(target, props, safeState);
            (instance as unknown as ComponentInstance<any, PropsOf<Component>, StateOf<Component>>).$afterMount(target);
            return instance;
        } else {
            target.innerHTML = (factory as TrivialComponentFactory<Component>).toString();
            return;
        }
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
            const d = diff(newProps, instance.props, true);
            if (d.length > 0) {
                isStatefulInstance(instance)
                    ? instance.$beforeUpdate(newProps, instance.state)
                    : instance.$beforeUpdate(newProps);
                instance.$updateProps(d);
            }
        }

        const aggregatedDiffs = new Map<Stateful<any, any, any>, {}>();
        stateDiffs.forEach(([instance, d]) => {
            const aggregated = aggregatedDiffs.has(instance) ? { ...aggregatedDiffs.get(instance), ...d } : d;
            aggregatedDiffs.set(instance, aggregated);
            changed.add(instance);
        });
        for (const [instance, stateDiff] of aggregatedDiffs) {
            const d = diff(stateDiff, instance.state, false);
            if (d.length > 0) {
                instance.$beforeUpdate(instance.props, stateDiff);
                instance.$updateState(d);
                // @ts-ignore
                instance.state = { ...instance.state, ...stateDiff };
            }
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
