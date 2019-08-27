import { Stateless, Context } from './component';
import { Diff } from '../runtime/utils';

export interface Context {
    root: HTMLElement;
}

export interface ComponentInstance<Ctx = Context, Props = {}, _State = any | never> {
    readonly context: Ctx;
    readonly props: Props;
    $updateProps: (diff: Diff<Props>, newProps: Props) => void;
    $afterMount: (ref: HTMLElement) => void;
    $afterUnmount: () => void;
    $beforeUpdate: (...args: any[]) => void;
    $afterUpdate: () => void;
}


abstract class Component<Ctx extends Context, Props> {
    constructor(
        readonly context: Ctx,
        readonly props: Props) {
        requestAnimationFrame(() => this.$afterMount(context.root));
    }
    public abstract $updateProps(diff: Diff<Props>, newProps: Props): void;

    public $afterMount(_ref: HTMLElement) {/** Noop */ }
    public $afterUnmount() {/** Noop */ }
    public $afterUpdate() {/** Noop */ }
}
export interface Stateless<Ctx extends Context = Context, Props extends {} = {}> extends ComponentInstance<Ctx, Props, never> {
    $beforeUpdate: (props: Props) => void;
}

// tslint:disable-next-line: max-classes-per-file
export abstract class StatelessComponent<Ctx extends Context, Props extends {}>
    extends Component<Ctx, Props>
    implements Stateless<Ctx, Props> {

    public $beforeUpdate(_props: Props) {/** Noop */ }
}


export interface Stateful<Ctx extends Context = Context, Props = any, State = any> extends ComponentInstance<Ctx, Props, State> {
    readonly state: State;
    $updateState: (diff: Diff<State>, delta: Partial<State>) => void;
    $beforeUpdate: (props: Props, stateDiff: State) => void;
}

// tslint:disable-next-line: max-classes-per-file
export abstract class StatefulComponent<Ctx extends Context, Props extends {}, State extends {}>
    extends Component<Ctx, Props>
    implements Stateful<Ctx, Props, State> {
    constructor(
        readonly context: Ctx,
        readonly props: Props,
        readonly state: State, ) {
        super(context, props);
    }
    public abstract $updateState(diff: Diff<State>, delta: Partial<State>): void;
    public $beforeUpdate(_props: Props, _stateDiff: State) {/** Noop */ }
}

export function isStatefulInstance<Ctx extends Context, Props, State>(instance: ComponentInstance<Ctx, Props, State>): instance is Stateful<Ctx, Props, State> {
    return '$updateState' in instance;
}
