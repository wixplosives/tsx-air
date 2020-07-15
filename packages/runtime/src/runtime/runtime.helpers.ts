import isArray from 'lodash/isArray';
import { getInstance, Displayable, VirtualElement } from '@tsx-air/runtime';

export function updateExpression(expMarkers: Comment[], values: IterableIterator<Text | HTMLElement>) {
    let first!: Node;
    for (const v of values) {
        first = first || v;
        expMarkers[1].parentNode!.insertBefore(v, expMarkers[1]);
    }
    // handle empty list
    first = first || expMarkers[1];
    while (expMarkers[0].nextSibling
        && expMarkers[0].nextSibling !== first) {
        expMarkers[0].nextSibling?.remove();
    }
}

export function* asDomNodes(values: any) {
    if (isArray(values)) {
        for (const v of values) {
            yield asSingleDomNode(v);
        }
    } else {
        if (values !== undefined) {
            yield asSingleDomNode(values);
        }
    }
}

export function asSingleDomNode(value: any) {
    if (VirtualElement.is(value)) {
        value = getInstance().getUpdatedInstance(value);
    }
    if (Displayable.is(value)) {
        return value.domRoot;
    }
    
    return new (getInstance().Text)(value);
}