import { ComponentFactory } from '../types/factory';
import { ComponentInstance } from '../types/component';
import { IntrinsicElements as IntrinsicElementsImported } from '../types/dom';

export interface TsxAirNode<PROPS> {
    type: ComponentFactory<ComponentInstance<any, PROPS, any>>;
    props: PROPS;
    key: string;
}

export type TsxAirChild<PROPS> = null | string | number | TsxAirNode<PROPS>;


export const TSXAir = <PROPS>(t: (props: PROPS) => JSX.Element) =>
    t as unknown as ((props: PROPS) => TsxAirNode<PROPS>);

TSXAir.createElement = (el: JSX.Element) => {
    return el as unknown as TsxAirNode<any>;
};


// tslint:disable-next-line: no-namespace
export namespace TSXAir.createElement {
    export namespace JSX {
        // export type Element = TsxAirNode<any>;
        export interface IntrinsicAttributes {
            key?: number;
        }
        // export type ElementClass = CompiledComponent<any, any>;
        // export interface ElementAttributesProperty { props: {}; }
        export interface ElementChildrenAttribute { children: {}; }
        // export interface IntrinsicClassAttributes<T> { };
        export type IntrinsicElements = IntrinsicElementsImported;
    }
}