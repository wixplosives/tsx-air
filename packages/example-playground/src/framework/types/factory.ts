import { Stateful, Stateless } from './component';


export function isStatefulFactory<Component>(factory: ComponentFactory<Component>):
    factory is StatefulComponentFactory<Component> {
    return 'initialState' in factory;
}

export function isNonTrivialFactory<Component>(factory: ComponentFactory<Component>): factory is NonTrivialComponentFactory<Component> {
    return ('hydrate' in factory);
}

export interface ComponentFactory<_Component> {
    unique: symbol;
    toString: (...args: any[]) => string;
}

export interface TrivialComponentFactory<_Component> extends ComponentFactory<_Component> {
    toString: () => string;
}

export interface NonTrivialComponentFactory<Component> extends ComponentFactory<Component> {
    toString: (props: PropsOf<Component>, state?: StateOf<Component>) => string;
    hydrate: (target: HTMLElement, props: PropsOf<Component>, state?: StateOf<Component>) => Component;
}

export interface StatelessComponentFactory<Component> extends NonTrivialComponentFactory<Component> {
    unique: symbol;
    toString: (props: PropsOf<Component>) => string;
    hydrate: (target: HTMLElement, props: PropsOf<Component>) => Component;
}

export interface StatefulComponentFactory<Component> {
    unique: symbol;
    toString: (props: PropsOf<Component>, state?: StateOf<Component>) => string;
    hydrate: (target: HTMLElement, props: PropsOf<Component>, state?: StateOf<Component>) => Component;
    initialState: (props: PropsOf<Component>) => StateOf<Component>;
}

export type Factory<Component> = Component extends Stateful<infer _Ctx, infer _Props, infer _State>
    ? StatefulComponentFactory<Component>
    : Component extends Stateless<infer _Ctx_, infer _Props_> ? StatelessComponentFactory<Component>
    : TrivialComponentFactory<Component>;

export type PropsOf<Component> = Component extends Stateful<infer _Ctx, infer Props, infer _State>
    ? Props & { key?:string }
    : Component extends Stateless<infer _Ctx_, infer Props_> ? Props_ : any;

export type StateOf<Component> =
    Component extends Stateful<infer _Ctx, infer _Props, infer State>
    ? State
    : never;