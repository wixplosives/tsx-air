import { launch, Browser } from 'puppeteer';
import { after, afterEach } from 'mocha';
import { Compiler } from '@tsx-air/compilers';
import { shouldBeCompiled } from '@tsx-air/examples';
import { getCompiledPage } from './utils';
import { createTestServer, TestServer } from './server/testserver';

export function validateCompilerWithExamples(compiler: Compiler) {
    describe(`Examples: ${compiler.label}`, () => {
        let browser: Browser;
        let server: TestServer;

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

        shouldBeCompiled.map(({ suite, path }) => suite(getCompiledPage(compiler.transformers, path, () => browser, () => server)));
    });
}
