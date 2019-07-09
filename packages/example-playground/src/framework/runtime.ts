
export const TSXAir = <T>(t: T) => t;
const elementMap: WeakMap<Element, Map<symbol, ComponentInstance<any, any>>> = new WeakMap();
export interface ComponentInstance<P, S = {}> {
    props: P;
    state: S;
    context: any;
    update?: (props: P, instance: ComponentInstance<P, S>) => void;
    unmount?: (instance: ComponentInstance<P, S>) => void;
}


export interface CompiledComponent<P, S = {}> {
    unique: symbol;
    initialState?: (props: P) => S;
    toString: (props: P, state?: any) => string;
    hydrate: (element: HTMLElement, instance: ComponentInstance<P, S>) => Record<string, ComponentInstance<any, any> | ChildNode>;
    update: (props: Partial<P>, state: Partial<S>, instance: ComponentInstance<P, S>) => void;
    unmount: (instance: ComponentInstance<P, S>) => void;
    fragments?: Record<string, CompiledComponent<any>>;
}

export const hydrate = <PROPS, STATE>(Comp: CompiledComponent<PROPS, STATE>, element: Element, props: PROPS) => {
    const instance: ComponentInstance<PROPS, STATE> = {
        props,
        context: {},
        state: Comp.initialState ? Comp.initialState(props) : {} as any
    };
    if (!elementMap.has(element)) {
        elementMap.set(element, new Map(
            [[Comp.unique, instance]]
        ));
    } else {
        elementMap.get(element)!.set(Comp.unique, instance);
    }
    instance.context = Comp.hydrate(element as HTMLElement, instance);
    instance.update = p => { Comp.update(p, instance.state, instance); instance.props = p; };
    instance.unmount = () => Comp.unmount(instance);
    return instance;
};

export const update = <PROPS, STATE>(Comp: CompiledComponent<PROPS, STATE>, element: Element, props: Partial<PROPS>, state: Partial<STATE>) => {
    const instance = elementMap.get(element)!.get(Comp.unique)!;
    Comp.update(props, state, instance);
    instance.state = { ...instance.state, ...state };
    instance.props = { ...instance.props, ...props };
};

