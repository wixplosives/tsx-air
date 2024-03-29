import { IntrinsicElements as IntrinsicElementsImported } from './dom';
import { ComponentApi, RenderTarget } from './component';

export interface TsxAirNode<PROPS> {
    props: PROPS;
}

export type TsxAirChild<Props> = null | string | number | TsxAirNode<Props> | CompCreator<Props> | CompCreator<any> | Array<CompCreator<any>> | HTMLElement | Array<TsxAirChild<Props>>;

export interface CompCreator<Props> {
    (props: Props): TsxAirNode<Props>;
    key?: string | number | null;
    render: (props: Props, target?: HTMLElement, add?: RenderTarget) => ComponentApi<Props>;
}

export const TSXAir = <Props>(t: (props: Props) => TsxAirChild<Props> | Promise<TsxAirChild<Props>>) =>
    t as CompCreator<Props>;

export namespace TSXAir {
    export namespace JSX {
        export type Element = TsxAirChild<any>;
        export interface IntrinsicAttributes {
            key?: any;
        }
        export interface ElementChildrenAttribute { children: {}; }
        export type IntrinsicElements = IntrinsicElementsImported;
    }
}

export interface RefHolder<T extends HTMLElement> {
    element?: T;
}