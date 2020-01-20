
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
    return x  && (!isNaN(Number(x.above)) || !isNaN(Number(x.below)));
}
export function isCount(x: any): x is Count {
    return isNaN(Number(x)) ? isRange(x) : true;
}
export function isHTMLMatcher(x: any): x is HTMLMatcher {
    if (x.scopeInstances !== undefined) {
        if (!isCount(x.scopeInstances)) {
            return false;
        }
    }
    if (x.pageInstances !== undefined) {
        if (!isCount(x.pageInstances)) {
            return false;
        }
    }
    if (x.textContent !== undefined) {
        if (!isText(x.textContent) && typeof x.textContent !== 'string') {
            return false;
        }
    }

    if (x.name !== undefined) {
        if (typeof x.name !== 'string') {
            return false;
        }
    }

    if (x.cssQuery !== undefined) {
        if (typeof x.cssQuery !== 'string') {
            return false;
        }
    }
    
    if (x.children) {
        if (!(x.children instanceof Array && x.children.every(isChildrenDescriptor))) {
            return false;
        }
    }
    if (x.descendants) {
        if (!(x.descendants instanceof Array && x.descendants.every(isChildrenDescriptor))) {
            return false;
        }
    }
    return true;
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