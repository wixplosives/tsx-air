
export interface HTMLMatcher {
    cssQuery: string;
    name?: string;
    children?: ChildrenDescriptor[];
    decedents?: ChildrenDescriptor[];
    scopeInstances?: Count;
    pageInstances?: Count;
    textContent?: Text | string;
    _directParent?: HTMLMatcher;
    _ancestor?: HTMLMatcher;
}

export type Count = Range | number;

export interface Range {
    above?: number;
    below?: number;
}
export function isRange(x: any): x is Range {
    return x  && (!isNaN(Number(x.above)) || !isNaN(Number(x.below)));
}
export function isCount(x: any): x is Count {
    return isNaN(Number(x)) ? isRange(x) : true;
}
export function isHTMLMatcher(x: any): x is HTMLMatcher {
    return typeof x.cssQuery === 'string';
}

export type ChildrenDescriptor = Count | HTMLMatcher;

export interface Text {
    ignoreWhiteSpace?: boolean | 'leading' | 'trailing';
    ignoreLineBreaks?: boolean;
    equals?: string;
    contains?: string;
    doesNotContain?: string;
}

export function isText(x: any): x is Text {
    return x && (typeof x.equals === 'string' ||
        typeof x.contains === 'string' ||
        typeof x.doesNotContain === 'string');
}