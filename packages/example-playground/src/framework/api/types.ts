import { Factory } from '../types/factory';
import { IntrinsicElements as IntrinsicElementsImported } from './dom';

export interface TsxAirNode<PROPS, T extends string | Factory<any>> {
    type: T;
    props: PROPS;
    key?: string | number | null;
}

export type TsxAirChild<Props> = null | string | number | TsxAirNode<Props, Factory<any>> | CompCreator<any> ;

// This interface serves as a component definition in pre-compiled code
export interface CompCreator<Props> {
    (props: Props): TsxAirNode<Props, Factory<any>>;
    factory: Factory<any>;
    key?: string | number | null;
}

export const TSXAir = <Props>(t: (props: Props) => TsxAirChild<Props> | Promise<TsxAirChild<Props>>) =>
    t as CompCreator<Props>;

// tslint:disable-next-line: no-namespace
export namespace TSXAir {
    export namespace JSX {
        export type Element = TsxAirChild<any>;
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