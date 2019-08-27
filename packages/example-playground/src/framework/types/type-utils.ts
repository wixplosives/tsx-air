export type IsTrivial<A extends {}, IfTrue, IfFalse> = A extends {} ? {} extends A ? IfTrue : IfFalse : IfTrue;
export type Meaningful<A> = IsTrivial<A, never, A>;
export type ByClassification<PROPS, STATE, Trivial, Stateless, Stateful = Stateless> = IsTrivial<STATE, IsTrivial<PROPS, Trivial, Stateless>, Stateful>;
type AllKeyValueTuplesByKey<T> = {
    [key in keyof T]: [key, T[key]]
};
export type ValueOf<T> = T[keyof T];
export type KeyValueTuple<T> = ValueOf<AllKeyValueTuplesByKey<T>>;
