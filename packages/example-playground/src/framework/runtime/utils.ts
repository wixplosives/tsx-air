export function assignTextContent(field: { textContent: string | null }) {
    return (v: string) => field.textContent = v;
}

export const noop = (..._: any[]) => void (0);

type AllKeyValueTuplesByKey<T> = {
    [key in keyof T]: [key, T[key]]
};
type ValueOf<T> = T[keyof T];
type KeyValueTuple<T> = ValueOf<AllKeyValueTuplesByKey<T>>;
export type Diff<T> = Array<KeyValueTuple<Required<T>>>;

export function diff<Model>(after: Model, before: Model, symmetric: true): Diff<Model>;
export function diff<Model>(after: Partial<Model>, before: Model, symmetric: false): Diff<Model>;
export function diff<Model>(after: Model, before: Model, symmetric: boolean = false): Diff<Model> {
    const keys = (symmetric
        ? [...Object.keys(after), ...Object.keys(before)]
        : Object.keys(after)
    ) as Array<keyof Model>;
    const processedKeys = new Set<keyof Model>();

    return keys.filter(key => {
        if (!processedKeys.has(key)) {
            processedKeys.add(key);
            return after[key] !== before[key];
        }
        return false;
    }).map(key => [key, after[key]]);
}

type ChangeHandlers<T> = { [key in keyof T]: (value: T[key]) => void };
export function handleDiff<Props>(d: Diff<Props>, handlers: ChangeHandlers<Props>) {
    for (const [key, value] of d) {
        handlers[key](value!);
    }
}
