import { Component } from './component';

export interface Factory<Comp> {
    unique: symbol;
    toString: (props: PropsOf<Comp>, state?: StateOf<Comp>) => string;
    hydrate: (target: HTMLElement, props: PropsOf<Comp>, state?: StateOf<Comp>) => Comp;
    initialState: (props: PropsOf<Comp>) => StateOf<Comp>;
}

export type PropsOf<Comp> = Comp extends Component<infer _Ctx, infer Props, infer _State>
    ? Props & { key?:string }
    : any;

export type StateOf<Comp> =
    Comp extends Component<infer _Ctx, infer _Props, infer State>
    ? State
    : any;
