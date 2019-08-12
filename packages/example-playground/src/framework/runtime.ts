

export type ConvertToCompiled<T extends (props: any) => JSX.Element> = T extends (props: infer P) => JSX.Element ? CompiledComponent<P, any> : T;

export const TSXAir = <T extends (props: any) => JSX.Element>(t: T) => t as T & ConvertToCompiled<T>;

const elementMap: WeakMap<Element, Map<symbol, ComponentInstance<any, any>>> = new WeakMap();

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

export const mountInstance = <PROPS, STATE>(Comp: CompiledComponent<PROPS, STATE>, element: Element, props: PROPS, state: STATE) => {
    const instance: PreInitComponentInstance<PROPS, STATE> = {
        props,
        context: {},
        state
    };

    instance.update = function (p, s) {
        if (Comp.update) {
            Comp.update(p, s || {}, this);
            instance.props = p;
            if (s) {
                instance.state = { ...instance.state, ...s };
            }
        }
    };
    instance.unmount = function () {
        if (Comp.unmount) {
            Comp.unmount(this);
        }
    };
    const initedInstance = instance as ComponentInstance<PROPS, STATE>;
    if (Comp.hydrate) {
        instance.context = Comp.hydrate(element as HTMLElement, initedInstance);
    }
    if (!elementMap.has(element)) {
        elementMap.set(element, new Map(
            [[Comp.unique, initedInstance]]
        ));
    } else {
        elementMap.get(element)!.set(Comp.unique, initedInstance);
    }
    return initedInstance;
};


export const hydrate = <PROPS, STATE>(Comp: CompiledComponent<PROPS, STATE>, element: Element, props: PROPS) => {
    const state = Comp.initialState ? Comp.initialState(props) : {} as any;
    return mountInstance(Comp, element, props, state);
};


let factoryElement: HTMLDivElement;
export const create = <PROPS, STATE>(Comp: CompiledComponent<PROPS, STATE>, props: PROPS) => {
    factoryElement = factoryElement || document.createElement('div');
    const state = Comp.initialState ? Comp.initialState(props) : {} as any;
    const str = Comp.toString(props, state);
    factoryElement.innerHTML = str;
    const element = factoryElement.firstElementChild! as HTMLElement;
    factoryElement.removeChild(element);
    return mountInstance(Comp, element, props, state);
};

export const render = <PROPS>(element: HTMLElement, Comp: CompiledComponent<PROPS, any>, props: PROPS) => {
    const state = Comp.initialState ? Comp.initialState(props) : {} as any;
    const str = Comp.toString(props, state);
    element.innerHTML = str;
    const createdElement = element.firstElementChild! as HTMLElement;
    return mountInstance(Comp, createdElement, props, state);
};


export const tsxAirNode = <PROPS = any>(Comp: CompiledComponent<PROPS, any>, props: PROPS) => {
    return {
        type: Comp,
        props
    };
};

export const elementToString = <PROPS = object>(node: TsxAirNode<PROPS>, overrideProps: Partial<PROPS>) => {
    const Comp = node.type;
    const merged = { ...node.props, ...overrideProps };
    const state = Comp.initialState ? Comp.initialState(merged) : {} as any;
    return Comp.toString(merged, state);
};

export const compToString = <PROPS = object>(Comp: CompiledComponent<PROPS, any>, props: PROPS) => {
    const state = Comp.initialState ? Comp.initialState(props) : {} as any;
    return Comp.toString(props, state);
};

export interface TsxAirNode<PROPS = object> {
    type: CompiledComponent<PROPS, any>;
    props: PROPS;
}

export const createElement = <PROPS>(el: TsxAirNode<PROPS>) => {
    return el as TsxAirNode<PROPS>;
};

export const cloneElement = <PROPS>(el: TsxAirNode<PROPS>, p: Partial<PROPS> = {}) => {
    return {
        type: el.type,
        props: {
            ...el.props,
            ...p
        }
    };
};