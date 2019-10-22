export type IsTrivial<A extends {}, IfTrue, IfFalse> = A extends {} ? {} extends A ? IfTrue : IfFalse : IfTrue;
export type Meaningful<A> = IsTrivial<A, never, A>;
export type ByClassification<PROPS, STATE, Trivial, Stateless, Stateful = Stateless> = IsTrivial<STATE, IsTrivial<PROPS, Trivial, Stateless>, Stateful>;
type Getters<T> = {
    [key in keyof T]: (key: key)=>T[key]
};
type Setters<T> = {
    [key in keyof T]: (key: key, value:T[key])=>number;
};
export type ChangeBitmask<T> = {
    [key in keyof T]: number;
};
export type ValueOf<T> = T[keyof T];
export type Getter<T> = ValueOf<Getters<T>>;
export type Setter<T> = ValueOf<Setters<T>>;
