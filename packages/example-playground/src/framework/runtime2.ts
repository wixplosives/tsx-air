import { IntrinsicElements as IntrinsicElementsImported } from './dom-types';
import { TsxAirChild, TsxAirNode, ComponentInstance } from './framework-types';
export { TsxAirChild, TsxAirNode, ComponentInstance } from './framework-types';
export { CSSProperties } from './dom-types';


export const TSXAir = <PROPS extends {}, STATE = any>(t: (props: PROPS) => TsxAirChild)
     => t as ((props: PROPS) => null | TsxAirNode<any>) & CompiledComponent<PROPS, STATE, any>;

// const elementMap: WeakMap<Element, Map<symbol, ComponentInstance<any, any, any>>> = new WeakMap();

export const mountInstance = <PROPS, STATE, CTX>(
    Comp: CompiledComponent<PROPS, STATE, CTX>,
    target: Element,
    props: PROPS,
    state: STATE
) => {

    // why not use prototype? 
    const instance: ComponentInstance<PROPS, STATE, CTX> = {
        props,
        state,
        update: (p, s) => {
            if (Comp.update) {
                Comp.update(p, s || {}, instance);
                instance.props = p;
                instance.state = s ? { ...instance.state, ...s } : instance.state;
            }
        },
        unmount: () => Comp.unmount && Comp.unmount(instance),

    };
    instance.context = Comp.hydrate && Comp.hydrate(target as HTMLElement, instance);
    return instance;
};

export const hydrate = <PROPS, STATE, CTX>(Comp: CompiledComponent<PROPS, STATE, CTX>, element: Element, props: PROPS) => {
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

export const render = <PROPS, STATE>(element: HTMLElement, Comp: CompiledComponent<PROPS, STATE, any>, props: PROPS) => {
    const state: STATE = Comp.initialState ? Comp.initialState(props) : {} as any;
    const str = Comp.toString(props, state);
    element.innerHTML = str;
    const createdElement = element.firstElementChild! as HTMLElement;
    return mountInstance(Comp, createdElement, props, state);
};


export const tsxAirNode = <PROPS extends { key?: string }>(Comp: CompiledComponent<PROPS, any>, props: PROPS) => {
    return {
        type: Comp,
        props,
        key: props.key || ''
    };
};

export const elementToString = <PROPS = object>(node: TsxAirNode<PROPS>, overrideProps: Partial<PROPS>) => {
    const Comp = node.type;
    const merged = { ...node.props, ...overrideProps };
    const state = Comp.initialState ? Comp.initialState(merged) : {} as any;
    return Comp.toString(merged, state);
};

export const compToString = <PROPS = object>(Comp: CompiledComponent<PROPS, any, any>, props: PROPS) => {
    const state = Comp.initialState ? Comp.initialState(props) : {} as any;
    return Comp.toString(props, state);
};



export const createElement = <PROPS>(el: TsxAirNode<PROPS>) => {
    return el as TsxAirNode<PROPS>;
};

export const cloneElement = <PROPS>(el: TsxAirNode<PROPS>, p: Partial<PROPS> & { key: string }) => {
    return {
        type: el.type,
        props: {
            ...el.props,
            ...p
        },
        key: p.key
    };
};
// tslint:disable-next-line: no-namespace
export namespace createElement {
    export namespace JSX {
        export type Element = TsxAirNode<any>;
        export interface IntrinsicAttributes {
            key?: string;
        }
        // export type ElementClass = CompiledComponent<any, any>;
        // export interface ElementAttributesProperty { props: {}; }
        export interface ElementChildrenAttribute { children: {}; }
        // export interface IntrinsicClassAttributes<T> { };
        export type IntrinsicElements = IntrinsicElementsImported;
    }
}