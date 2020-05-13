import { Component, Dom } from '../types/component';
import { PropsOf, StateOf, Factory } from '../types/factory';
import cloneDeep from 'lodash/cloneDeep';
import { RuntimeCycle } from './stats';

type Mutator = (obj: any) => number;
type StateMutator<Comp> = Comp extends Component<infer _Dom, infer _Props, infer State>
    ? (state: State) => number
    : never;
type PropsMutator<Comp> = Comp extends Component<infer _Dom, infer Props, infer _State>
    ? (props: Props) => number
    : never;
type PropMutation<Comp> = Comp extends Component<infer _Dom, infer Props, infer _State>
    ? [Comp, PropsMutator<Props>]
    : never;
type StateMutation<Comp> = Comp extends Component<infer _Dom, infer _Props, infer State>
    ? [Comp, StateMutator<State>]
    : never;

const flags = {
    preRender: 1 << 63
};

export class Runtime {
    public readonly flags = flags;

    public $stats = [] as RuntimeCycle[];

    private pending: {
        props: Array<PropMutation<Component>>;
        states: Array<StateMutation<Component>>;
        requested: Map<Component, IterableIterator<void>>;
    } = {
        props: [],
        states: [],
        requested: new Map()
    };

    private ignoreStateChanges = new Set<Component>();
    private updateTriggered: boolean = false;

    public $tick = (fn: FrameRequestCallback) => window.requestAnimationFrame(fn);
    public execute<Comp extends Component>(instance: Comp, method: (...args: any[]) => any, ...args: any[]) {
        const volatile = this.preRender(instance, instance.props, instance.state);
        return method.apply(instance, [instance.props, instance.state, volatile, ...args]);
    }
    public updateProps<Ctx extends Dom, Props, State, Comp extends Component<Ctx, Props, State>>(
        instance: Comp,
        mutator: PropsMutator<Comp>
    ) {
        // @ts-ignore
        this.pending.props.push([instance, mutator]);
        this.triggerViewUpdate();
    }

    public updateState<Ctx extends Dom, Props, State, Comp extends Component<Ctx, Props, State>>(
        instance: Comp,
        localState: State,
        mutator: StateMutator<Comp>
    ) {
        if (this.ignoreStateChanges.has(instance)) {
            return;
        }
        if (!this.isMockComponent(instance)) {
            // @ts-ignore
            this.pending.states.push([instance, mutator]);
            this.triggerViewUpdate();
        } else {
            mutator(localState);
        }
    }

    public render<Ctx extends Dom, Props, State, Comp extends Component<Ctx, Props, State>>(
        target: HTMLElement,
        factory: Factory<Comp>,
        props: PropsOf<Comp>,
        state?: StateOf<Comp>
    ): Comp {
        const safeState = state || factory.initialState(props);
        target.innerHTML = factory.toString(props, safeState);
        const compHtml = target.children[0] as HTMLElement;
        return factory.hydrate(compHtml, props, safeState);
    }

    public preRender<Ctx extends Dom, Props, State, Comp extends Component<Ctx, Props, State>>(
        instance: Comp,
        props: Props,
        state: State,
        changeState = false
    ) {
        if (!changeState) {
            this.ignoreStateChanges.add(instance);
        }
        const v: object = instance.$preRender(props || instance.props, state || instance.state);
        if (!changeState) {
            this.ignoreStateChanges.delete(instance);
        }
        return v;
    }

    public toStringPreRender<Props, State>(compType: any, props: Props, state: State) {
        // TODO: remove this hack after changing update state/props to be sync
        const mockComp = { props, state };
        const v = compType.prototype.$preRender.call(mockComp, props, state);
        return v;
    }

    private isMockComponent(instance: any) {
        return !instance.$updateView;
    }

    private mutate(
        mutator: Mutator,
        instance: Component,
        initialData: any,
        mutatedData: Map<Component, any>,
        changeBitmasks: Map<Component, number>
    ) {
        if (!mutatedData.has(instance)) {
            mutatedData.set(instance, cloneDeep(initialData));
        }
        const modMapping = mutator(mutatedData.get(instance));
        const oldChangeMap = changeBitmasks.get(instance) || 0;
        const newChangeMap = oldChangeMap | modMapping;
        changeBitmasks.set(instance, newChangeMap);
        return !(modMapping & flags.preRender);
    }

    private runAllMutations(
        changeBitmasks: Map<Component, number>,
        updatesCount: Map<Component, number>,
        latestProps: Map<Component, {}>,
        latestStates: Map<Component, {}>
    ) {
        const { props, states, requested } = this.pending;
        this.pending = { props: [], states: [], requested };

        props.forEach(([instance, mutator]) => {
            if (this.mutate(mutator, instance, instance.props, latestProps, changeBitmasks)) {
                updatesCount.set(instance, (updatesCount.get(instance) || 0) + 1);
            }
        });
        states.forEach(([instance, mutator]) => {
            if (this.mutate(mutator, instance, instance.state, latestStates, changeBitmasks)) {
                updatesCount.set(instance, (updatesCount.get(instance) || 0) + 1);
            }
        });
    }

    private updateViewOnce() {
        const changeBitmasks = new Map<Component, number>([...this.pending.requested.keys()].map(k => [k, 0]));
        const updatesCount = new Map<Component, number>();
        const latestProps = new Map<Component, {}>();
        const latestStates = new Map<Component, {}>();

        this.runAllMutations(changeBitmasks, updatesCount, latestProps, latestStates);

        changeBitmasks.forEach((changeMap, instance) => {
            const getNew = () => [
                latestProps.get(instance) || instance.props,
                latestStates.get(instance) || instance.state
            ];
            let [newProps, newState] = getNew();

            let volatile: any = null;
            for (let i = 0; i < (updatesCount.get(instance) || 0); i++) {
                volatile = this.preRender(instance, newProps, newState, !volatile);
                this.runAllMutations(changeBitmasks, updatesCount, latestProps, latestStates);
                [newProps, newState] = getNew();
            }
            changeMap = changeBitmasks.get(instance)!;
            instance.$updateView(newProps, newState, volatile, changeMap);
            // @ts-ignore
            instance.props = newProps;
            // @ts-ignore
            instance.state = newState;
        });
        return changeBitmasks.keys();
    }

    private updateView = () => {
        const stateTime = performance.now();
        const changed = new Set<Component>();

        let oneUpdate = [...this.updateViewOnce()];
        while(oneUpdate.length > 0) {
            oneUpdate.forEach(item => changed.add(item));
            oneUpdate = [...this.updateViewOnce()];
        }
        this.updateTriggered = false;
        
        if (changed.size > 0) {
            changed.forEach(i => {
                const req = this.pending.requested.get(i) || (i.$afterUpdate && i.$afterUpdate());
                if (req && !req.next().done) {
                    this.pending.requested.set(i, req);
                } else {
                    this.pending.requested.delete(i);
                }
            });
        }
        this.$stats.push({
            stateTime,
            endTime: performance.now(),
            changed: changed.size
        });
    };

    private triggerViewUpdate() {
        if (!this.updateTriggered) {
            this.updateTriggered = true;
            this.updateView();
        }
    }
}
