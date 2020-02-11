import { HTMLMatcher, isHTMLMatcher, isChildrenDescriptor, ChildrenDescriptor, isCount } from './page.matcher.types';
import { ElementHandle } from 'puppeteer';
import { expectCount } from './expect.count';
import { expect } from 'chai';
import { isArrayOf } from '@tsx-air/utils';

export function printable(matcher: HTMLMatcher): HTMLMatcher {
    const p = (m: HTMLMatcher | ChildrenDescriptor) => {
        if (!isHTMLMatcher(m)) {
            return m;
        }
        const res = { ...m };
        delete res._ancestor;
        delete res._directParent;
        if (res.children) {
            res.children = res.children.map(p);
        }
        if (res.descendants) {
            res.descendants = res.descendants.map(p);
        }
        return res;
    };
    return p(matcher) as HTMLMatcher;
}

export function withAncestors(matcher: HTMLMatcher): HTMLMatcher {
    const res = { ...matcher, name: matcher.name || 'matcher root' };
    if (res.children) {
        res.children = res.children.map(child =>
            isHTMLMatcher(child)
                ? withAncestors({
                    ...child,
                    _directParent: res,
                    name: child.name || (res.name ? `a child of ${res.name}` : '')
                })
                : child);
    }
    if (res.descendants) {
        res.descendants = res.descendants.map(descendant => isHTMLMatcher(descendant)
            ? withAncestors({
                ...descendant,
                _ancestor: res,
                name: descendant.name || (res.name ? `a descendant of ${res.name}` : '')
            })
            : descendant);
    }
    return res;
}

export function buildFullQuery(matcher: HTMLMatcher): string {
    if (matcher._directParent) {
        return buildFullQuery(matcher._directParent) + ' > ' + (matcher.cssQuery || '*');
    }
    if (matcher._ancestor) {
        return buildFullQuery(matcher._ancestor) + ' ' + (matcher.cssQuery || '*');
    }
    return matcher.cssQuery || '';
}

export type GenericChecker = (query: string | undefined, checkMatcher: HTMLMatcher, assertion: (found: ElementHandle[]) => void) => void;
export type HtmlMatchChecker = (matcher: HTMLMatcher) => void;
export type Checker = GenericChecker & HtmlMatchChecker;

export function assertElementsCount(expected: any, name: string, check: Checker, cssQuery: string, checkMatcher: HTMLMatcher = {}) {
    name = name + ' count';
    if (isCount(expected)) {
        check(cssQuery, {
            ...checkMatcher, name, cssQuery
        }, ({ length }) =>
            expectCount(length, expected, name));
    } else {
        expect(expected, `Matcher error: ${name}`).to.equal(undefined);
    }
}

export function handleDescendants(
    matcher: HTMLMatcher,
    fieldName: 'children' | 'descendants',
    scopeQuery: string,
    check: Checker
) {
    if (isArrayOf(matcher[fieldName], isChildrenDescriptor, false)) {
        const field = matcher[fieldName] as ChildrenDescriptor[];
        const fieldCss = fieldName === 'children' ? '>*' : ' *';

        field.forEach(descriptor => {
            if (isCount(descriptor)) {
                assertElementsCount(descriptor, `${fieldName} of ${matcher.name}`, check, scopeQuery + fieldCss, {});
            }
            if (isHTMLMatcher(descriptor)) {
                const htmlDescMatcher = { ...descriptor } as HTMLMatcher;
                if (fieldName === 'children') {
                    htmlDescMatcher._directParent = matcher;
                } else {
                    htmlDescMatcher._ancestor = matcher;
                }
                check(htmlDescMatcher);
            }
        });
    }
}

