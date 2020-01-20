import { HTMLMatcher, isHTMLMatcher } from './page.matcher.types';

export function withAncestors(matcher: HTMLMatcher): HTMLMatcher {
    const res = { ...matcher };
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
        return buildFullQuery(matcher._directParent) + ' > ' + matcher.cssQuery;
    }
    if (matcher._ancestor) {
        return buildFullQuery(matcher._ancestor) + ' ' + matcher.cssQuery;
    }
    return matcher.cssQuery || '';
}