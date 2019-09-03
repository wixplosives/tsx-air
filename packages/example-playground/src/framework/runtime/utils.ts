import { Component } from './../types/component';
import { Factory, PropsOf } from './../types/factory';

export function assignTextContent(field: { textContent: string | null }, value:string) {
    return () => field.textContent = value;
}

export const noop = (..._: any[]) => void (0);

type AllKeyValueTuplesByKey<T> = {
    [key in keyof T]: [key, T[key]]
};
type ValueOf<T> = T[keyof T];
type KeyValueTuple<T> = ValueOf<AllKeyValueTuplesByKey<T>>;
export type Diff<T> = Array<KeyValueTuple<Required<T>>>;

function asDiff <Model>(source: Model): Diff<Model> {
    return Object.keys(source).map(i => [i as keyof Model, source[i as keyof Model]]);
}

export function diff<Model>(after: Model, before: Model, symmetric: true): Diff<Model>;
export function diff<Model>(after: Partial<Model>, before: Model, symmetric: false): Diff<Model>;
export function diff<Model>(after: Model, before: Model, symmetric: boolean = false): Diff<Model> {
    if (!after) {
        return symmetric ? asDiff(before) : [];
    }
    if (!before) {
        before = {} as Model;
    }
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
export function handleDiff<Model>(d: Diff<Model>, handlers: ChangeHandlers<Model>) {
    for (const [key, value] of d) {
        handlers[key](value!);
    }
}

export function toStringChildren<Child>(props: Array<PropsOf<Child>>, factory: Factory<Child>): string {
    return props.map(p => factory.toString(p)).join('');
}


const validKeys = (data: object) => Object.keys(data)
    // @ts-ignore
    .filter(prop => data[prop] && /^[a-z][\w$\-]*$/i.test(prop));
const convertClassName = (key: string) => key === 'className' ? 'class' : key;

export function spreadToElementString(elmType: string, data: object): string {
    const props = validKeys(data)
        // @ts-ignore
        .map(prop => `${convertClassName(prop)}="${data[prop]}"`).join(' ');
    // @ts-ignore
    return `<${elmType} ${props}>${data.$textContent || ''}</${elmType}>`;
}

export function updateSpreadElement(elm: HTMLElement, data: object) {
    const keys = new Set(validKeys(data));
    Array.from(elm.attributes).forEach(att => {
        if (keys.has(convertClassName(att.name))) {
            // @ts-ignore
            att.value = data[att.name];
            keys.delete(att.name);
        } else {
            elm.removeAttribute(convertClassName(att.name));
        }
    });
    // @ts-ignore
    keys.forEach(k => elm.setAttribute(convertClassName(k), data[k]));

    if ('$textContent' in data) {
        // @ts-ignore
        elm.textContent = data.$textContent;
    }
}

export function setProp<Props>(instance: Component<any, Props, any>, p: Props, value: any, key: keyof Props) {
    if (p[key]!==value) {
        p[key] = value;
        return instance.propMap[key];
    }
    return 0;
}

export function handleChanges(handlers:Map<number, ()=>void>, changesFlags:number) {
    for (const [bitmask, action] of handlers) {
        // tslint:disable-next-line: no-bitwise
        if (bitmask & changesFlags) {
            action();
        }
    }
}