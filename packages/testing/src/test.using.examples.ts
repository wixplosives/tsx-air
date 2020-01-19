import { exampleSrcPath } from '@tsx-air/examples';
import { launch, Browser } from 'puppeteer';
import { after, afterEach } from 'mocha';
import { Compiler, GetPage } from '@tsx-air/types';
import { createTestServer, TestServer, loadSuite } from '@tsx-air/testing';
import ts from 'typescript';
import { browserify } from '@tsx-air/browserify';
import { join, basename } from 'path';

export function shouldCompileExamples(compiler: Compiler, examplePaths: string[]) {
    const examples = examplePaths.map(loadSuite);
    describe(`Examples: ${compiler.label}`, function () {
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

        examples.map(
            ({ suite, path }) => suite(getCompiledPage(compiler.transformers, path, () => browser, () => server)));
    });
}


export function getCompiledPage(
    transformers: ts.CustomTransformers,
    examplePath: string,
    getBrowser: () => Browser,
    getServer: () => TestServer
): GetPage {
    return async function getPage(testBoilerplatePath: string) {
        const [browser, server] = [getBrowser(), getServer()];
        const boilerplate = await browserify({
            base: join(exampleSrcPath, basename(examplePath)),
            entry:  testBoilerplatePath,
            output: join(__dirname, '../.tmp/builerplate.js'),
            debug: !!process.env.DEBBUG,
            loaderOptions: {
                transformers,
                cache: false
            }
        });
        try {
            // compiler, loader, examplePath, testBoilerplatePath);
            await Promise.all([
                server.addEndpoint('/index.html', `<html>
                    <body>
                        <div></div>
                        <script src="/boilerplate.js"></script>
                    </body>
                </html>`),
                server.addEndpoint('/boilerplate.js', boilerplate)
            ]);
        } catch (e) {
            throw new Error('Error running test server\n' + e);
        }
        const page = browser.newPage();
        const url = `${await server.baseUrl}/index.html`;
        const pageErrors: Error[] = [];
        (await page).on('pageerror', (e: Error) => {
            pageErrors.push(e);
        });
        await (await page).goto(url);
        if (pageErrors.length) {
            throw new Error('Test boilerplate page contains the following errors\n\tTip: use "DEBUG=true yarn test" to debug in browser\n\n' + pageErrors.join('\'n'));
        }
        return page;
    };
}
