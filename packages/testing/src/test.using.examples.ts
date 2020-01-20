import { safely } from '@tsx-air/utils';
import { launch, Browser } from 'puppeteer';
import { after, afterEach } from 'mocha';
import { Compiler, GetPage, ExampleSuiteApi } from '@tsx-air/types';
import { createTestServer, TestServer, loadSuite } from '@tsx-air/testing';
import ts from 'typescript';
import { browserify } from '@tsx-air/browserify';
import { join, basename, dirname } from 'path';
import { expect } from 'chai';

const exampleSrcPath = join(dirname(require.resolve('@tsx-air/examples/package.json')), 'src', 'examples');

export function shouldCompileExamples(compiler: Compiler, examplePaths: string[]) {
    const examples = examplePaths.map(loadSuite);
    describe(`${compiler.label}: compiling examples`, function () {
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
            ({ suite, path }) =>
                describe(basename(path), () => {
                    // @ts-ignore
                    const api = new SuiteApiProxy();

                    beforeEach(async () => {
                        try {
                            const getPage = getCompiledPage(compiler.transformers, path, () => browser, () => server);
                            api._api = {
                                page: await getPage('./suite.boilerplate.ts'),
                                getPage,
                                server
                            };
                        } catch (e){
                            expect.fail('Failed to compile example');
                        }
                    });

                    suite.call(this, api);
                }));
    });
}

class SuiteApiProxy implements ExampleSuiteApi {
    public _api!: ExampleSuiteApi;

    get getPage() {
        return this._api.getPage;
    }
    get page() {
        return this._api.page;
    }
    get server() {
        return this._api.server;
    }
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
            entry: testBoilerplatePath,
            output: join(__dirname, '../.tmp/boilerplate.js'),
            debug: !!process.env.DEBBUG,
            loaderOptions: {
                transformers,
                cache: false
            }
        });
        await safely(async () => {
            // compiler, loader, examplePath, testBoilerplatePath);
            Promise.all([
                server.addEndpoint('/index.html', `<html>
                    <body>
                        <div></div>
                        <script src="/boilerplate.js"></script>
                    </body>
                </html>`),
                server.addEndpoint('/boilerplate.js', boilerplate)
            ]);
        }, 'Error running test server');
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
