import { expect } from 'chai';
import { FrameBase, ElementHandle } from 'puppeteer';
import { isHTMLMatcher, isCount, HTMLMatcher, isText } from './page.matcher.types';
import { expectCount, buildFullQuery, withAncestors, expectText } from './page.matcher.helpers';

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
    const { cssQuery, pageInstances, scopeInstances, textContent } = matcher;
    const name = matcher.name ? matcher.name + ': ' : '';
    const scopeQuery = buildFullQuery(matcher);
    if (isText(textContent) || typeof matcher.textContent === 'string') {
        pending.push(new Promise((resolve, reject) => {
            check(cssQuery, { cssQuery, pageInstances }, found => Promise.all(found.map(elm =>
                (elm.evaluate(t => t.textContent).then(t => expectText(t, textContent!, name)))
            )).then(()=>resolve()).catch(reject));
        }));
    }

    if (isCount(pageInstances)) {
        check(cssQuery, { cssQuery, pageInstances }, ({ length }) => expectCount(length, pageInstances!, `${name}page instances`));
    } else {
        expect(pageInstances, `Matcher error: ${name}invalid pageInstances value`).to.equal(undefined);
    }
    if (isCount(scopeInstances)) {
        check(scopeQuery, { cssQuery, scopeInstances }, ({ length }) => expectCount(length, scopeInstances!, `${name}scope instances`));
    } else {
        expect(scopeInstances, `Matcher error: ${name}invalid scope instances value`).to.equal(undefined);
    }
    if (matcher.children) {
        matcher.children.forEach(childrenDescriptor =>
            pending.push(Promise.resolve(
                (async () => {
                    if (isCount(childrenDescriptor)) {
                        const children = [childrenDescriptor];
                        check(scopeQuery + '>*', { cssQuery, children }, ({ length }) => expectCount(length, childrenDescriptor));
                        return;
                    }
                    if (isHTMLMatcher(childrenDescriptor)) {
                        checks.push(
                            ...(await htmlMatch(page, { ...childrenDescriptor, _directParent: matcher }))
                        );
                        return;
                    }
                    throw new Error(`${name}invalid children matcher`);
                })()
            ))
        );
    }
    if (matcher.decedents) {
        matcher.decedents.forEach(decedentsDescriptor =>
            pending.push(Promise.resolve(
                (async () => {
                    if (isCount(decedentsDescriptor)) {
                        const decedents = [decedentsDescriptor];
                        check(scopeQuery + ' *', { cssQuery, decedents }, ({ length }) => expectCount(length, decedentsDescriptor));
                        return;
                    }
                    if (isHTMLMatcher(decedentsDescriptor)) {
                        checks.push(
                            ...(await htmlMatch(page, { ...decedentsDescriptor, _ancestor: matcher }))
                        );
                        return;
                    }
                    throw new Error(`${name}invalid defendants matcher`);
                })()
            ))
        );
    }

    await Promise.all(pending);
    const sourceMatcher: Check = Promise.all(checks).then(() => void (0)) as Check;
    sourceMatcher.matcher = matcher;
    sourceMatcher.scopeQuery = scopeQuery;
    await sourceMatcher;

    expect(checks).to.have.length.above(0, `${name}nothing was checked`);
    await Promise.all(checks);
    return [sourceMatcher, ...checks];
}
