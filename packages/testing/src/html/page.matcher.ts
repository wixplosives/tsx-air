import { expect } from 'chai';
import { ElementHandle, FrameBase } from 'puppeteer';
import { isHTMLMatcher, HTMLMatcher, isText } from './page.matcher.types';
import { buildFullQuery, withAncestors, assertElementsCount, handleDescendants, Checker, printable } from './page.matcher.helpers';
import { expectText } from './expect.text';

export interface Check extends Promise<void> {
    scopeQuery: string;
    matcher: HTMLMatcher;
    error?: Error;
    checkerId: number;
}

export async function htmlMatch(page: ElementHandle | FrameBase, matcher: HTMLMatcher, isExternal = true): Promise<Check[]> {
    const pending: Array<Promise<void>> = [];
    const checks: Check[] = [];

    const check: Checker = (...args: any[]) => {
        if (isHTMLMatcher(args[0])) {
            pending.push(new Promise(async added => {
                try {
                    const htmlChecks = await htmlMatch(page, args[0], false);
                    checks.push(...htmlChecks);
                } catch (e) {
                    if (e.check) {
                        checks.push(...e.checks);
                    } else {
                        const failedCheck = Promise.reject(e) as Check;
                        failedCheck.error = e;
                        failedCheck.matcher = args[0];
                        failedCheck.scopeQuery = scopeQuery;
                        checks.push(failedCheck);
                    }
                }
                added();
            }));
        } else {
            const [query, checkMatcher, assertion] = args;
            const checkFor: Check = (query
                ? page.$$(query).then(assertion)
                : assertion([page as unknown as ElementHandle]))
                .catch((err: Error) => checkFor.error = err) as Check;
            checkFor.scopeQuery = query || '';
            checkFor.matcher = printable(checkMatcher || withAncestors(matcher));
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

    let lastCount = -1;
    while (pending.length > lastCount) {
        lastCount = pending.length;
        await Promise.all(pending);
        await Promise.all(checks);
    }

    const failed = checks.find(c => c.error);
    if (failed) {
        (failed.error as any).checks = checks;
        throw failed.error;
    }
    try {
        expect(checks).to.have.length.above(0, `${name}nothing was checked`);
    } catch (e) {
        e.checks = checks;
        throw e;
    }

    if (isExternal) {
        const sourceMatcher: Check = Promise.resolve() as Check;
        sourceMatcher.matcher = printable(matcher);
        sourceMatcher.scopeQuery = scopeQuery;
        return [sourceMatcher, ...checks];
    } else {
        return checks;
    }
}
