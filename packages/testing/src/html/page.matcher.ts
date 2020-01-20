import { expect } from 'chai';
import { ElementHandle, FrameBase } from 'puppeteer';
import { isHTMLMatcher, isCount, HTMLMatcher, isText } from './page.matcher.types';
import {  buildFullQuery, withAncestors } from './page.matcher.helpers';
import { expectText } from './expect.text';
import { expectCount } from './expect.count';

export interface Check extends Promise<void> {
    scopeQuery: string;
    matcher: HTMLMatcher;
}

export async function htmlMatch(page: ElementHandle | FrameBase, matcher: HTMLMatcher): Promise<Check[]> {
    const pending: Array<Promise<void>> = [];
    const checks: Check[] = [];
    const check = (query: string|undefined, checkMatcher: HTMLMatcher, fn: (found: ElementHandle[]) => void) => {
        const checkFor: Check = (query ? page.$$(query).then(fn) : fn([page as unknown as ElementHandle])) as Check;
        checkFor.scopeQuery = query || '';
        checkFor.matcher = checkMatcher || withAncestors(matcher);
        checks.push(checkFor);
    };
    if (!(matcher._ancestor || matcher._directParent)) {
        matcher = withAncestors(matcher);
    }
    const { cssQuery, pageInstances, scopeInstances, textContent } = matcher;
    const name = matcher.name ? matcher.name + ': ' : '';
    const scopeQuery = buildFullQuery(matcher);
    
    if (isText(textContent) || typeof textContent === 'string') {
        pending.push(new Promise((resolve, reject) => {
            check(cssQuery, { cssQuery, pageInstances }, found => Promise.all(found.map(elm =>
                (elm.evaluate(t => t.textContent).then(t => expectText(t, textContent!, name)))
            )).then(() => resolve()).catch(reject));
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
                        check(scopeQuery + '>*', { name:name + 'children count',cssQuery, children }, ({ length }) => expectCount(length, childrenDescriptor));
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
    if (matcher.descendants) {
        matcher.descendants.forEach(descendantDescriptor =>
            pending.push(Promise.resolve(
                (async () => {
                    if (isCount(descendantDescriptor)) {
                        const descendant = [descendantDescriptor];
                        check(scopeQuery + ' *', { cssQuery, descendants: descendant }, ({ length }) => expectCount(length, descendantDescriptor));
                        return;
                    }
                    if (isHTMLMatcher(descendantDescriptor)) {
                        checks.push(
                            ...(await htmlMatch(page, { ...descendantDescriptor, _ancestor: matcher }))
                        );
                        return;
                    }
                    throw new Error(`${name}invalid descendants matcher`);
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
