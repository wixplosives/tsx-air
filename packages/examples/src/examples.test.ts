import { launch, Page } from 'puppeteer';
import exp1 from './examples/01.stateless-parent-child/index.suite';
import { after } from 'mocha';
import { getExampleManuallyCompiledPage } from './test.utils';

const examples = [exp1];

const pup = launch({ headless: false, devtools: true });

describe.only('Examples: manually compiled code', () => {
    const pages = new Set<Promise<Page>>();
    afterEach(() => {
        pages.forEach(async p => {
            pages.delete(p);
            (await p).close();
        });
    });
    after(async () => (await pup).close());
    examples.map(({ suite, path }) => suite(getExampleManuallyCompiledPage(path, pup, pages)));
});