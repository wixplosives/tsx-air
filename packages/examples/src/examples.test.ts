import { TestServer, createTestServer } from './testserver';
import { launch, Browser } from 'puppeteer';
import exp1 from './examples/01.stateless-parent-child/suite';
import { after } from 'mocha';
import { getExampleManuallyCompiledPage } from './test.utils';
const examples = [exp1];

describe('Examples: manually compiled code', () => {
    let browser: Browser;
    let server: TestServer;

    before(async () => {
        [browser, server] = await Promise.all([
            launch({ headless: false, devtools: true }),
            createTestServer()
        ]);
    });

    afterEach(async () => {
        server.reset();
        (await browser.pages()).forEach(p=>{
            p.close();
        });
    });
    after(() => browser.close());
    after(() => server.close());
    
    examples.map(({ suite, path }) => suite(getExampleManuallyCompiledPage(path, () => browser, () => server)));
});