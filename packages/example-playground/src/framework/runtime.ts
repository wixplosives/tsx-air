import { IntrinsicElements as IntrinsicElementsImported, CompiledComponent, ComponentInstance, PreInitComponentInstance, TsxAirNode, TsxAirChild } from './dom-types';
import { checkPropTypes } from 'prop-types';



export const TSXAir = <PROPS extends {}, STATE = any>(t: (props: PROPS) => TsxAirChild) => t as ((props: PROPS) => null | TsxAirNode<any>) & CompiledComponent<PROPS, STATE>;

const elementMap: WeakMap<Element, Map<symbol, ComponentInstance<any, any>>> = new WeakMap();

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

export const compToString = <PROPS = object>(Comp: CompiledComponent<PROPS, any>, props: PROPS) => {
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