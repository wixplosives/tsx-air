
export interface TsxAirNode<PROPS = object> {
    type: CompiledComponent<PROPS, any>;
    props: PROPS;
    key: string;
}


export interface PreInitComponentInstance<P, S = {}> {
    props: P;
    state: S;
    context: any;
    update?: (this: ComponentInstance<P, S>, props: P, state?: Partial<S>) => void;
    unmount?: (this: ComponentInstance<P, S>, instance: ComponentInstance<P, S>) => void;
}

export interface ComponentInstance<P, S = {}> extends PreInitComponentInstance<P, S> {
    props: P;
    state: S;
    context: any;
    update: (this: ComponentInstance<P, S>, props: Partial<P>, state?: Partial<S>) => void;
    unmount: (this: ComponentInstance<P, S>, instance: ComponentInstance<P, S>) => void;
}

export interface CompiledComponent<P, S = {}> {
    unique: symbol;
    initialState?: (props: P) => S;
    toString: (props: P, state?: any) => string;
    hydrate?: (element: HTMLElement, instance: ComponentInstance<P, S>) => Record<string, ComponentInstance<any, any> | ChildNode>;
    update?: (props: Partial<P>, state: Partial<S>, instance: ComponentInstance<P, S>) => void;
    unmount?: (instance: ComponentInstance<P, S>) => void;
    fragments?: Record<string, CompiledComponent<any>>;
}

export type TsxAirChild = null | string | number | TsxAirNode<any>;
