import { expect } from 'chai';
import { ElementHandle, FrameBase } from 'puppeteer';
import { isHTMLMatcher, HTMLMatcher, isText } from './page.matcher.types';
import { buildFullQuery, withAncestors, assertElementsCount, handleDescendants, Checker } from './page.matcher.helpers';
import { expectText } from './expect.text';

export interface Check extends Promise<void> {
    scopeQuery: string;
    matcher: HTMLMatcher;
}

export async function htmlMatch(page: ElementHandle | FrameBase, matcher: HTMLMatcher): Promise<Check[]> {
    const pending: Array<Promise<void>> = [];
    const checks: Check[] = [];
    const check: Checker = (...args: any[]) => {
        if (isHTMLMatcher(args[0])) {
            pending.push(new Promise(async added => {
                checks.push(...await htmlMatch(page, args[0]));
                added();
            }));
        } else {
            const [query, checkMatcher, assertion] = args;
            const checkFor: Check = (query ? page.$$(query).then(assertion) : assertion([page as unknown as ElementHandle])) as Check;
            checkFor.scopeQuery = query || '';
            checkFor.matcher = checkMatcher || withAncestors(matcher);
            checks.push(checkFor);
        }
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
    
    assertElementsCount(pageInstances, `${name}page instances`, check, cssQuery!, { pageInstances });
    assertElementsCount(scopeInstances, `${name}scope instances`, check, scopeQuery, { scopeInstances });
    handleDescendants(matcher, 'children', scopeQuery, check);
    handleDescendants(matcher, 'descendants', scopeQuery, check);


    await Promise.all(pending);
    const sourceMatcher: Check = Promise.all(checks).then(() => void (0)) as Check;
    sourceMatcher.matcher = matcher;
    sourceMatcher.scopeQuery = scopeQuery;
    await sourceMatcher;

    expect(checks).to.have.length.above(0, `${name}nothing was checked`);
    await Promise.all(checks);
    return [sourceMatcher, ...checks];
}

