import { isWrongType, isArrayOf } from '@tsx-air/utils';

export interface HTMLMatcher {
    cssQuery?: string;
    name?: string;
    children?: ChildrenDescriptor[];
    descendants?: ChildrenDescriptor[];
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
    return x && (!isNaN(Number(x.above)) || !isNaN(Number(x.below)));
}
export function isCount(x: any): x is Count {
    return isNaN(Number(x)) ? isRange(x) : true;
}

export function isHTMLMatcher(x: any): x is HTMLMatcher {
    const y = x as HTMLMatcher;
    const allowedKeys = ['cssQuery','name','children','descendants','scopeInstances','pageInstances','textContent','_directParent','_ancestor'];

    return !(
        isWrongType(x, 'object')
        || isWrongType(y.scopeInstances, isCount)
        || isWrongType(y.pageInstances, isCount)
        || isWrongType(y.textContent, 'string', isText)
        || isWrongType(y.name, 'string')
        || isWrongType(y.cssQuery, 'string')
        || isWrongType(y.children, c => isArrayOf(c, isChildrenDescriptor))
        || isWrongType(y.descendants, c => isArrayOf(c, isChildrenDescriptor))
        || !Object.keys(x).every(key => allowedKeys.includes(key))
    );
}

export type ChildrenDescriptor = Count | HTMLMatcher;

export function isChildrenDescriptor(x: any): x is ChildrenDescriptor {
    return isHTMLMatcher(x) || isCount(x);
}
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