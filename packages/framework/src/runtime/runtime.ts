import { Component, Dom } from '../types/component';
import { PropsOf, StateOf, Factory } from '../types/factory';
import cloneDeep from 'lodash/cloneDeep';
import { RuntimeCycle } from './stats';

type Mutator = (obj: any) => number;
type StateMutator<Comp> = Comp extends Component<infer _Dom, infer _Props, infer State> ? (state: State) => number : never;
type PropsMutator<Comp> = Comp extends Component<infer _Dom, infer Props, infer _State> ? (props: Props) => number : never;
type PropMutation<Comp> = Comp extends Component<infer _Dom, infer Props, infer _State> ? [Comp, PropsMutator<Props>] : never;
type StateMutation<Comp> = Comp extends Component<infer _Dom, infer _Props, infer State> ? [Comp, StateMutator<State>] : never;


const flags = {
    preRender: 1 << 63
};

export class Runtime {
    public readonly flags = flags;

    public $stats = [] as RuntimeCycle[];

    private pending: {
        props: Array<PropMutation<Component>>,
        states: Array<StateMutation<Component>>,
        requested: Map<Component, IterableIterator<void>>
    } = {
            props: [], states: [],
            requested: new Map()
        };

    private viewUpdatePending: boolean = false;

    public $tick = (fn: FrameRequestCallback) => window.requestAnimationFrame(fn);

    public updateProps<Ctx extends Dom, Props, State, Comp extends Component<Ctx, Props, State>>(instance: Comp, mutator: PropsMutator<Comp>) {
        // @ts-ignore
        this.pending.props.push([instance, mutator]);
        this.triggerViewUpdate();
    }

    public updateState<Ctx extends Dom, Props, State, Comp extends Component<Ctx, Props, State>>
        (instance: Comp, mutator: StateMutator<Comp>) {
        // @ts-ignore
        this.pending.states.push([instance, mutator]);
        this.triggerViewUpdate();
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

    private mutate(
        mutator: Mutator,
        instance: Component,
        initialData: any,
        mutatedData: Map<Component, any>,
        changeBitmasks: Map<Component, number>,
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

            let volatile: any;
            for (let i = 0; updatesCount.get(instance) || 0; i++) {
                volatile = instance.$preRender ? instance.$preRender(newProps, newState) : {};
                this.runAllMutations(changeBitmasks, updatesCount, latestProps, latestStates);
                [newProps, newState] = getNew();
            }

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

        this.viewUpdatePending = false;
        const changed = new Set<Component>();
        for (const i of this.updateViewOnce()) {
            changed.add(i);
        }

        if (changed.size > 0) {
            this.$tick(() => {
                changed.forEach(i => {
                    const req = this.pending.requested.get(i) || i.$afterUpdate && i.$afterUpdate();
                    if (req && !req.next().done) {
                        this.pending.requested.set(i, req);
                    } else {
                        this.pending.requested.delete(i);
                    }
                });
            });
        }
        this.$stats.push({
            stateTime,
            endTime: performance.now(),
            changed: changed.size
        });
    };

    private triggerViewUpdate() {
        if (!this.viewUpdatePending) {
            this.viewUpdatePending = true;
            this.$tick(this.updateView);
        }
    }
}
