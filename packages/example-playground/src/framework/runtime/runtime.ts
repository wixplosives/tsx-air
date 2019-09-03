import { Component, Dom } from '../types/component';
import { PropsOf, StateOf, Factory } from '../types/factory';
import { cloneDeep } from 'lodash';
/*  tslint:disable:rule: no-bitwise */


type Mutator = (obj: any) => number;
type StateMutator<Comp> = Comp extends Component<infer _Dom, infer _Props, infer State> ? (state: State) => number : never;
type PropsMutator<Comp> = Comp extends Component<infer _Dom, infer Props, infer _State> ? (props: Props) => number : never;
type PropMutation<Comp> = Comp extends Component<infer _Dom, infer Props, infer _State> ? [Comp, PropsMutator<Props>] : never;
type StateMutation<Comp> = Comp extends Component<infer _Dom, infer _Props, infer State> ? [Comp, StateMutator<State>] : never;
// type SomeComp<Comp> = Comp extends Component<infer Ctx, infer Props, infer State> ? Component<Ctx, Props, State>: never;

export class Runtime {
    private pending: {
        props: Array<PropMutation<Component>>,
        states: Array<StateMutation<Component>>,
        requested: Map<Component, IterableIterator<void>>
    } = {
            props: [], states: [],
            requested: new Map()
        };


    private viewUpdatePending: boolean = false;

    public updateProps<Ctx extends Dom, Props, State, Comp extends Component<Ctx, Props, State>>(instance: Comp, mutator: PropsMutator<Comp>) {
        // @ts-ignore
        this.pending.props.push([instance, mutator]);
        this.triggerViewUpdate();
    }

    public updateState<Ctx extends Dom, Props, State, Comp extends Component<Ctx, Props, State>>(instance: Comp, mutator: StateMutator<Comp>) {
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
        changeBitmasks.set(instance, changeBitmasks.get(instance)! | modMapping);
    }

    private updateViewOnce(
        props: Array<PropMutation<Component>>,
        states: Array<StateMutation<Component>>,
        requested: Map<Component, IterableIterator<void>>) {

        const changeBitmasks = new Map<Component, number>([...requested.keys()].map(k => [k, 0]));
        const latestProps = new Map<Component, {}>();
        const latestStates = new Map<Component, {}>();

        props.forEach(([instance, mutator]) => this.mutate(mutator, instance, instance.props, latestProps, changeBitmasks));
        states.forEach(([instance, mutator]) => this.mutate(mutator, instance, instance.state, latestStates, changeBitmasks));

        changeBitmasks.forEach((changeMap, instance) => {
            const newProps = latestProps.get(instance) || instance.props;
            const newState = latestStates.get(instance) || instance.state;

            instance.$beforeUpdate(newProps, newState);
            instance.$$processUpdate(newProps, newState, changeMap);
            // @ts-ignore
            instance.props = newProps;
            // @ts-ignore
            instance.state = newState;
        });
        return changeBitmasks.keys();
    }

    private updateView = () => {
        this.viewUpdatePending = false;
        const changed = new Set<Component>();
        const { props, states, requested } = this.pending;
        this.pending = { props: [], states: [], requested };
        for (const i of this.updateViewOnce(props, states, requested)) {
            changed.add(i);
        }

        if (changed.size > 0) {
            window.requestAnimationFrame(() => {
                changed.forEach(i => {
                    const req = this.pending.requested.get(i) || i.$afterUpdate();
                    if (!req.next().done) {
                        this.pending.requested.set(i, req);
                    } else {
                        this.pending.requested.delete(i);
                    }
                });
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
