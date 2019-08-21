import { ComponentFactory } from '../types/factory';
import { IntrinsicElements as IntrinsicElementsImported } from '../types/dom';

export interface TsxAirNode<PROPS, T extends string | ComponentFactory<any>> {
    type: T;
    props: PROPS;
    key: string | number | null;
}

export type TsxAirChild<PROPS> = null | string | number | TsxAirNode<PROPS, ComponentFactory<any>>;


export const TSXAir = <PROPS>(t: (props: PROPS) => TsxAirChild<PROPS>) =>
    t as unknown as ((props: PROPS) => TsxAirNode<PROPS, ComponentFactory<any>>);

TSXAir.createElement = (el: JSX.Element) => {
    return el as TsxAirNode<any, ComponentFactory<any>>;
};

// tslint:disable-next-line: no-namespace
declare namespace JSX {
    export type Element = TsxAirChild<any>;
    export interface IntrinsicAttributes {
        key?: number;
    }
    // export type ElementClass = CompiledComponent<any, any>;
    export interface ElementAttributesProperty { props: {}; }
    export interface ElementChildrenAttribute { children: {}; }
    // export interface IntrinsicClassAttributes<T> { };
    export type IntrinsicElements = IntrinsicElementsImported;
}

// tslint:disable-next-line: no-namespace
// export namespace TSXAir.createElement {
//     // tslint:disable-next-line: no-shadowed-variable
//     export namespace JSX {
//         export type Element = TsxAirChild<any>;
//         export interface IntrinsicAttributes {
//             key?: number;
//         }
//         // export type ElementClass = CompiledComponent<any, any>;
//         export interface ElementAttributesProperty { props: {}; }
//         export interface ElementChildrenAttribute { children: {}; }
//         // export interface IntrinsicClassAttributes<T> { };
//         export type IntrinsicElements = IntrinsicElementsImported;
//     }
// }