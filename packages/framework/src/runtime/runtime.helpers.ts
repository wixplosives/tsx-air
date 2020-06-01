import { isVirtualElement, isDisplayable } from "..";
import isArray from "lodash/isArray";

export function updateExpression(expMarkers: Comment[], values: IterableIterator<Text | HTMLElement>) {
    let first!: Node;
    for (const v of values) {
        first = first || v;
        expMarkers[1].parentNode?.insertBefore(v, expMarkers[1]);
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
        if (values) {
            yield asSingleDomNode(values);
        }
    }
}

export function asSingleDomNode(value: any) {
    if (isVirtualElement(value)) {
        value = value.getUpdatedInstance();
    }
    if (isDisplayable(value)) {
        return value.getDomRoot();
    }
    return new Text(value);
}