import { ComponentInstance, StatefulInstance } from './framework-types';
import { HTMLAttributes, ImgHTMLAttributes } from './dom-types';

export function assignOrCreate<T extends HTMLElement>(node: ChildNode, expectedType: new () => T, propsIfCreated: Partial<HTMLAttributes<T> | ImgHTMLAttributes<HTMLImageElement>>): T {
    if (node instanceof expectedType) {
        return node;
    }
    const newElement = new expectedType();
    for (const [key, value] of Object.entries(propsIfCreated)) {
        newElement.setAttribute(key, value);
    }
    return newElement;
}

export function assignTextContent(field:Text) {
    return (v:string) => field.textContent = v;
}

export const noop = (..._: any[]) => void (0);

type AllKeyValueTuplesByKey<T> = {
    [key in keyof T]: [key, T[key]]
};
type ValueOf<T> = T[keyof T];
type KeyValueTuple<T> = ValueOf<AllKeyValueTuplesByKey<T>>;

export function* changedValues<MODEL>(newModel: Partial<MODEL>, oldModel: MODEL): IterableIterator<KeyValueTuple<MODEL>> {
    for (const [key, value] of Object.entries(newModel)) {
        const [_key, _value] = [key, value] as KeyValueTuple<MODEL>;
        if (_value !== oldModel[_key]) {
            yield [_key, _value];
        }
    }
}

export function diff<MODEL>(after: MODEL, before: MODEL, symmetric: true): IterableIterator<KeyValueTuple<MODEL>>;
export function diff<MODEL>(after: Partial<MODEL>, before: MODEL, symmetric: false): IterableIterator<KeyValueTuple<MODEL>>;
export function* diff<MODEL>(after: MODEL, before: MODEL, symmetric: boolean = false): IterableIterator<KeyValueTuple<MODEL>> {
    const keys = new Set<keyof MODEL>((symmetric ? [...Object.keys(after), ...Object.keys(before)] : Object.keys(after)) as Array<keyof MODEL>);
    for (const key of keys) {
        if (after[key] !== before[key]) {
            yield [key, after[key]];
        }
    }
}

type ChangeHandlers<T> = { [key in keyof T]: (value: T[key]) => void };
export function handlePropsUpdate<PROPS>(
    props: PROPS,
    instance: ComponentInstance<any, PROPS, any>,
    handlers: ChangeHandlers<PROPS>) {
    for (const [key, value] of diff(props, instance.props, true)) {
        handlers[key](value!);
    }
}
export function handleStateUpdate<STATE>(
    state: Partial<STATE>,
    instance: StatefulInstance<any, any, STATE>,
    handlers: ChangeHandlers<STATE>) {
    for (const [key, value] of changedValues(state, instance.state)) {
        handlers[key](value);
    }
}