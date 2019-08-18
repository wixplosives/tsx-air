type IsTrivial<A extends {}, IfTrue, IfFalse> = A extends {} ? {} extends A ? IfTrue : IfFalse : never;
type Meaningful<A> = IsTrivial<A, never, A>;
type ByClassification<PROPS, STATE, Trivial, Stateless, Stateful = Stateless> = IsTrivial<STATE, IsTrivial<PROPS, Trivial, Stateless>, Stateful>;

export interface TsxAirNode<PROPS = {}, STATE = {}> {
    type: ByClassification<PROPS, STATE, TrivialComponentFactory,
        StatelessComponentFactory<PROPS, any>,
        StatefulComponentFactory<PROPS, STATE, any>>;
    props: Meaningful<PROPS>;
    key: string;
}

export interface ComponentInstance<CTX, PROPS, _STATE = never> {
    readonly props: PROPS;
    readonly context: CTX;
    _updateProps: (props: PROPS) => void;
    _afterMount: () => void;
    _afterUnmount: () => void;
    _beforeUpdate: (...args: any[]) => void;
    _afterUpdate: () => void;
}
export interface StatelessInstance<CTX, PROPS> extends ComponentInstance<CTX, PROPS> {
    _beforeUpdate: (props: PROPS) => void;
}

export interface StatefulInstance<CTX, PROPS, STATE> extends ComponentInstance<CTX, PROPS, STATE> {
    readonly state: STATE;
    _updateState: (state: STATE) => void;
    _beforeUpdate: (props: PROPS, stateDiff: STATE) => void;
}

export interface Compiled<_CTX, _PROPS, _STATE> {
    unique: symbol;
    toString: (...args: any[]) => string;
}

export interface TrivialComponentFactory extends Compiled<{}, {}, {}> {
    toString: () => string;
}

export interface NonTrivialComponentFactory<CTX, PROPS, STATE> extends Compiled<CTX, PROPS, STATE> {
    hydrate: (target: HTMLElement, props: PROPS, state?: STATE) => ComponentInstance<CTX, PROPS, STATE>;
}

export interface StatelessComponentFactory<CTX, PROPS> extends NonTrivialComponentFactory<CTX, PROPS, never> {
    toString: (props: PROPS) => string;
    hydrate: (target: HTMLElement, props: PROPS) => StatelessInstance<CTX, PROPS>;
}

export interface StatefulComponentFactory<CTX, PROPS, STATE> extends Compiled<CTX, PROPS, STATE> {
    toString: (props: PROPS, state: STATE) => string;
    hydrate: (target: HTMLElement, props: PROPS, state: STATE) => StatefulInstance<CTX, PROPS, STATE>;
    initialState: (props: PROPS) => STATE;
}

export function isStateful<CTX, PROPS, STATE>(factory: Compiled<CTX, PROPS, STATE>): factory is StatefulComponentFactory<CTX, PROPS, STATE> {
    return 'initialState' in factory;
}

export function isStatefulInstance<CTX, PROPS, STATE>(instance: ComponentInstance<CTX, PROPS, STATE>): instance is StatefulInstance<CTX, PROPS, STATE> {
    return 'initialState' in instance;
}

export function isNonTrivial<CTX, PROPS, STATE>(factory: Compiled<CTX, PROPS, STATE>): factory is NonTrivialComponentFactory<CTX, PROPS, STATE> {
    return ('hydrate' in factory);
}
