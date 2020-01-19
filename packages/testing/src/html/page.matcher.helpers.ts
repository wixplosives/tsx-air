import { HTMLMatcher, isRange, Count, isText, isHTMLMatcher, Text } from './page.matcher.types';
import { expect } from 'chai';

export function withAncestors(matcher: HTMLMatcher): HTMLMatcher {
    const res = { ...matcher };
    if (res.children) {
        res.children = res.children.map(child => isHTMLMatcher(child)
            ? withAncestors({
                ...child,
                _directParent: res,
                name: child.name || res.name ? `a child of ${res.name}` : undefined
            })
            : child);
    }
    if (res.decedents) {
        res.decedents = res.decedents.map(decedent => isHTMLMatcher(decedent)
            ? withAncestors({
                ...decedent,
                _ancestor: res,
                name: decedent.name || res.name ? `decedent of ${res.name}` : undefined
            })
            : decedent);
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

export function expectCount(actual: any, expected: Count, message?: string) {
    expect(actual).to.be.a('number', message);
    if (isRange(expected)) {
        if (expected.above !== undefined && expected.below !== undefined) {
            expect(actual, message).to.be.within(expected.above, expected.below);
        } else {
            if (expected.above !== undefined) {
                expect(actual, message).to.be.above(expected.above);
            } else {
                expect(actual, message).to.be.below(expected.below!);
            }
        }
    } else {
        expect(expected, `${message ? message + ': ' : ''}range must be a number or have above/below`).to.be.a('number');
        expect(actual, message).to.equal(expected);
    }
}

export function expectText(actual: any, expected: Text | string, message?: string) {
    expect(actual, message).to.be.a('string');
    if (isText(expected)) {
        let compare = actual as string;
        const applyReplace = (regEx: RegExp, replacement: string) => {
            compare = compare.replace(regEx, replacement);
            if (expected.contains) {
                expected.contains = expected.contains.replace(regEx, replacement);
            }
            if (expected.doesNotContain) {
                expected.doesNotContain = expected.doesNotContain.replace(regEx, replacement);
            }
            if (expected.equals) {
                expected.equals = expected.equals.replace(regEx, replacement);
            }
        };
        switch (expected.ignoreLineBreaks) {
            case true:
                applyReplace(/^\n+/g, '');
                applyReplace(/\n+$/g, '');
                applyReplace(/\n+/g, ' ');
                break;
            default:
        }
        switch (expected.ignoreWhiteSpace) {
            case 'leading':
                applyReplace(/^[ \t]+/mg, '');
                break;
            case 'trailing':
                applyReplace(/[ \t]+$/gm, '');
                break;
            case true:
                applyReplace(/[ \t]+/gm, ' ');
                applyReplace(/^[ \t]/gm, '');
                applyReplace(/[ \t]+$/gm, '');
                break;
            default:
        }
        if (expected.equals !== undefined) {
            expect(compare, message).to.equal(expected.equals);
        }
        if (expected.contains !== undefined) {
            expect(compare, message).to.contain(expected.contains);
        }
        if (expected.doesNotContain !== undefined) {
            expect(compare, message).not.to.contain(expected.doesNotContain);
        }
    } else {
        expectText(actual, {
            equals: expected,
            ignoreLineBreaks: true,
            ignoreWhiteSpace: true
        }, message);
    }
}