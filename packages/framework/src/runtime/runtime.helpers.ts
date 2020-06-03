import isArray from "lodash/isArray";
import { TSXAir } from "..";
import {  isDisplayable } from "../types/component";
import { isVirtualElement } from "../types/virtual.element";

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
        if (values !== undefined) {
            yield asSingleDomNode(values);
        }
    }
}

export function asSingleDomNode(value: any) {
    if (isVirtualElement(value)) {
        value = TSXAir.runtime.getUpdatedInstance(value);
    }
    if (isDisplayable(value)) {
        return value.getDomRoot();
    }
    
    return new (TSXAir.runtime.Text)(value);
}

export function remapChangedBit(changes: number, mapping?: Map<number, number>): number {
    const remapBitAtIndex = (index: number) => {
        const isolated = changes & (1<<index);
        return mapping!.get(isolated) || 0;
    }
    const lastMeaningfulBitIndex = () => {
        for (let i=0 ; i<63 ; i++) {
            if (!(changes & (0xffffffff << i))) {
                return i;
            }
        }
        return 63;
    }
    if (mapping) {
        let remapped = 0;
        for (let i=0 ; i<lastMeaningfulBitIndex() ; i++) {
            remapped |= remapBitAtIndex(i);
        }
        return remapped;
    } else {
        return changes;
    }
}