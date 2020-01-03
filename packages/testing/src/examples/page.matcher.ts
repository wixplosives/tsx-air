import { expect } from 'chai';
import { FrameBase, ElementHandle } from 'puppeteer';
import { isHTMLMatcher, isCount, HTMLMatcher } from './page.matcher.types';
import { expectCount, buildFullQuery, withAncestors, isTrivialMatcher } from './page.matcher.helpers';

export interface Check extends Promise<void> {
    scopeQuery: string;
    matcher: HTMLMatcher;
}

export async function htmlMatch(page: FrameBase, matcher: HTMLMatcher): Promise<Check[]> {
    const pending: Array<Promise<void>> = [];
    const checks: Check[] = [];
    const check = (query: string, checkMatcher: HTMLMatcher, fn: (found: Array<ElementHandle<Element>>) => void) => {
        const checkFor: Check = page.$$(query).then(fn) as Check;
        checkFor.scopeQuery = query;
        checkFor.matcher = checkMatcher;
        checks.push(checkFor);
    };
    if (!(matcher._ancestor || matcher._directParent)) {
        matcher = withAncestors(matcher);
    }
    const match = buildFullQuery(matcher);
    if (isTrivialMatcher(matcher)) {
        matcher.scopeInstances = { above: 0 };
    }

    if (isCount(matcher.pageInstances)) {
        const { cssQuery, pageInstances } = matcher;
        check(matcher.cssQuery, { cssQuery, pageInstances }, ({ length }) => expectCount(length, pageInstances!));
    } else {
        expect(matcher.pageInstances, 'Invalid pageInstances value').to.equal(undefined);
    }
    if (isCount(matcher.scopeInstances)) {
        const { cssQuery, scopeInstances } = matcher;
        check(match, { cssQuery, scopeInstances }, ({ length }) => expectCount(length, scopeInstances!, `"${matcher.name}" scope instances count`));
    } else {
        expect(matcher.scopeInstances, `"${matcher.name}": scope instances count: `).to.equal(undefined);
    }
    if (matcher.children) {
        matcher.children.forEach(childrenDescriptor =>
            pending.push(Promise.resolve(
                (async () => {
                    if (isCount(childrenDescriptor)) {
                        const { cssQuery } = matcher;
                        const children = [childrenDescriptor];
                        check(match + '>*', { cssQuery, children }, ({ length }) => expectCount(length, childrenDescriptor));
                        return;
                    }
                    if (isHTMLMatcher(childrenDescriptor)) {
                        checks.push(
                            ...(await htmlMatch(page, { ...childrenDescriptor, _directParent: matcher }))
                        );
                        return;
                    }
                    expect.fail('Invalid children matcher');
                })()
            ))
        );
    }
    if (matcher.decedents) {
        matcher.decedents.forEach(decedentsDescriptor =>
            pending.push(Promise.resolve(
                (async () => {
                    if (isCount(decedentsDescriptor)) {
                        const { cssQuery } = matcher;
                        const decedents = [decedentsDescriptor];
                        check(match + ' *', { cssQuery, decedents }, ({ length }) => expectCount(length, decedentsDescriptor));
                        return;
                    }
                    if (isHTMLMatcher(decedentsDescriptor)) {
                        checks.push(
                            ...(await htmlMatch(page, { ...decedentsDescriptor, _ancestor: matcher }))
                        );
                        return;
                    }
                    expect.fail('Invalid defendants matcher');
                })()
            ))
        );
    }
    await Promise.all(pending);
    await Promise.all(checks);
    return checks;
}
