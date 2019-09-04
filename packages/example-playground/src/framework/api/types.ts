import { ComponentFactory } from '../types/factory';
import { IntrinsicElements as IntrinsicElementsImported } from './dom';

export interface TsxAirNode<PROPS, T extends string | ComponentFactory<any>> {
    type: T;
    props: PROPS;
    key?: string | number | null;
}

export type TsxAirChild<Props = any> = null | string | number | TsxAirNode<Props, ComponentFactory<any>> | CompCreator<any>;

// This interface serves as a component definition in pre-compiled code
export interface CompCreator<Props> {
    (props: Props): TsxAirNode<Props, ComponentFactory<any>>;
    factory: ComponentFactory<any>;
    key?: string | number | null;
}

export const TSXAir = <Props>(t: (props: Props) => TsxAirChild<Props>) =>
    t as CompCreator<Props>;

// tslint:disable-next-line: no-namespace
export namespace TSXAir {
    export namespace JSX {
        export type Element = TsxAirChild<any> | any;
        export interface IntrinsicAttributes {
            key?: string;
        }
        export interface ElementChildrenAttribute { children: {}; }
        export type IntrinsicElements = IntrinsicElementsImported;
    }
}

export interface RefHolder<T extends HTMLElement> {
    element?: T;
}