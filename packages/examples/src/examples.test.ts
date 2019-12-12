import { launch, Page, Browser } from 'puppeteer';
import exp1 from './examples/01.stateless-parent-child/index.suite';
import { after } from 'mocha';
import { getExampleManuallyCompiledPage } from './test.utils';

const examples = [exp1];

describe('Examples: manually compiled code', () => {
    const pages = new Set<Page>();
    let browser: Browser;
    before(async () => {
        browser = await launch(/* { headless: false, devtools: true } */);
    });
    afterEach(() => {
        pages.forEach(async p => {
            pages.delete(p);
            (await p).close();
        });
    });
    after(() => browser.close());
    examples.map(({ suite, path }) => suite(getExampleManuallyCompiledPage(path, browser, pages)));
});