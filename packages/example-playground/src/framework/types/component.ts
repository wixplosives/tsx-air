import { Diff } from '../runtime/utils';

export interface ComponentInstance<Ctx = any, Props = any, _State = any> {
    readonly props: Props;
    readonly context: Ctx;
    $updateProps: (diff: Diff<Props>) => void;
    $afterMount: (ref: HTMLElement) => void;
    $afterUnmount: () => void;
    $beforeUpdate: (...args: any[]) => void;
    $afterUpdate: () => void;
}

export interface Stateless<Ctx = any, Props = any> extends ComponentInstance<Ctx, Props, never> {
    $beforeUpdate: (props: Props) => void;
}

export interface Stateful<Ctx = any, Props = any, State = any> extends ComponentInstance<Ctx, Props, State> {
    readonly state: State;
    $updateState: (diff: Diff<State>, delta:Partial<State>) => void;
    $beforeUpdate: (props: Props, stateDiff: State) => void;
}

export function isStatefulInstance<Ctx, Props, State>(instance: ComponentInstance<Ctx, Props, State>): instance is Stateful<Ctx, Props, State> {
    return '$updateState' in instance;
}
