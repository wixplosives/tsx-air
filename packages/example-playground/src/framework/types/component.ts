import { Diff } from '../runtime/utils';

export interface ComponentInstance<Ctx, Props, _State> {
    readonly props: Props;
    readonly context: Ctx;
    $updateProps: (diff: Diff<Props>) => void;
    $afterMount: (ref:HTMLElement) => void;
    $afterUnmount: () => void;
    $beforeUpdate: (...args: any[]) => void;
    $afterUpdate: () => void;
}

export interface Stateless<Ctx, Props> extends ComponentInstance<Ctx, Props, never> {
    $beforeUpdate: (props: Props) => void;
}

export interface Stateful<Ctx, Props, State> extends ComponentInstance<Ctx, Props, State> {
    readonly state: State;
    $updateState: (diff: Diff<State>) => void;
    $beforeUpdate: (props: Props, stateDiff: State) => void;
}

export function isStatefulInstance<Ctx, Props, State>(instance: ComponentInstance<Ctx, Props, State>): instance is Stateful<Ctx, Props, State> {
    return '$updateState' in instance;
}
