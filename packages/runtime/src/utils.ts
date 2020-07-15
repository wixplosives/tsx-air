import { Component } from './types/component';

export function assignTextContent(field: { textContent: string | null }, value: string) {
    return () => field.textContent = value;
}

export const noop = (..._: any[]) => void (0);

type AllKeyValueTuplesByKey<T> = {
    [key in keyof T]: [key, T[key]]
};
type ValueOf<T> = T[keyof T];
export type KeyValueTuple<T> = ValueOf<AllKeyValueTuplesByKey<T>>;

export type ChangeHandlers<T> = { [key in keyof T]: (value: T[key]) => void };

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

export function setProp<Props>(instance: Component, p: Props, value: any, key: keyof Props) {
    if (p[key] !== value) {
        p[key] = value;
        // @ts-ignore
        return instance.constructor.changeBitmask['props.'+key];
    }
    return 0;
}

export function handleChanges(changeMask:Record<string, number>, handlers: Map<string, () => void>, changesFlags: number) {
    for (const [key, action] of handlers) {
        if (changeMask[key] & changesFlags) {
            action();
        }
    }
}

export function setStyle(element: HTMLElement, style: object) {
    let stl = '';
    for (const [key, value] of Object.entries(style)) {
        stl = `${stl}${key}:${isNaN(Number(value)) ? value : (value | 0) + 'px'};`;
    }
    element.setAttribute('style', stl);
}


export function createFromString(str: string): HTMLElement {
    const factory = document.createElement('div');
    factory.innerHTML = str;
    return factory.children[0] as HTMLElement;
}