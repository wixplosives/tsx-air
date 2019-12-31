import { launch, Browser } from 'puppeteer';
import { after, afterEach } from 'mocha';
import { Compiler } from '@tsx-air/compilers';
import { shouldBeCompiled, ExampleSuite } from '@tsx-air/examples';
import { createTestServer, TestServer } from '../net';
import { getCompiledPage } from '../utils';

export function testCompilerWithExamples(compiler: Compiler, extraSuites:ExampleSuite[]=[]) {
    describe(`Examples: ${compiler.label}`, function() {
        let browser: Browser;
        let server: TestServer;
        this.bail(false);
        this.timeout(5000);

        before(async () => {
            [browser, server] = await Promise.all([
                launch({ headless: !process.env.DEBUG, devtools: !!process.env.DEBUG }),
                createTestServer()
            ]);
        });

        afterEach(async () => {
            server.reset();
            (await browser.pages()).forEach(p => {
                p.close().catch(() => '');
            });
        });
        after(() => browser.close());
        after(() => server.close());

        [...shouldBeCompiled, ...extraSuites].map(
            ({ suite, path }) => suite(getCompiledPage(compiler.transformers, path, () => browser, () => server)));
    });
}
