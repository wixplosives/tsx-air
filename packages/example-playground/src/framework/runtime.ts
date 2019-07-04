
export const TSXAir = <T>(t: T) => t;
const elementMap: WeakMap<Element, Map<symbol, ComponentInstance<any>>> = new WeakMap();
export interface ComponentInstance<P> {
    props: P;
    state: any;
    context: any;
    update?: (props: P, instance: ComponentInstance<P>) => void;
    unmount?: (instance: ComponentInstance<P>) => void;
}

export interface CompiledComponent<P> {
    unique: symbol;
    initialState?: (props: P) => any;
    toString: (props: P, state?: any) => string;
    hydrate: (element: HTMLElement, instance: ComponentInstance<P>) => Record<string, ComponentInstance<any> | ChildNode>;
    update: (props: P, state: any, instance: ComponentInstance<P>) => void;
    unmount: (instance: ComponentInstance<P>) => void;
}

export const hydrate = <PROPS>(Comp: CompiledComponent<PROPS>, element: Element, props: PROPS) => {
    const instance: ComponentInstance<PROPS> = {
        props,
        context: {},
        state: Comp.initialState ? Comp.initialState(props) : {}
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

export const update = <PROPS>(Comp: CompiledComponent<PROPS>, element: Element, props: PROPS, state: any) => {
    const instance = elementMap.get(element)!.get(Comp.unique)!;
    Comp.update(props, state, instance);
    instance.state = state;
    instance.props = props;
};

