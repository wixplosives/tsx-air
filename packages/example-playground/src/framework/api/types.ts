import { ComponentFactory } from '../types/factory';
import { IntrinsicElements as IntrinsicElementsImported } from '../types/dom';

export interface TsxAirNode<PROPS, T extends string | ComponentFactory<any>> {
    type: T;
    props: PROPS;
    key: string | number | null;
}

export type TsxAirChild<Props> = null | string | number | TsxAirNode<Props, ComponentFactory<any>>;

// This interface serves as a component definition in pre-compiled code
export interface CompCreator<Props> {
    (props: Props): TsxAirNode<Props, ComponentFactory<any>>;
    factory: ComponentFactory<any>;
}

export const TSXAir = <Props>(t: (props: Props) => TsxAirChild<Props>) =>
    t as CompCreator<Props>;

TSXAir.createElement = (el: JSX.Element) => {
    return el as TsxAirNode<any, ComponentFactory<any>>;
};


// tslint:disable-next-line: no-namespace
export namespace TSXAir {
    export namespace createElement {
        export namespace JSX {
            export type Element = TsxAirNode<any, any>;
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
}