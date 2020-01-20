import { safely } from '@tsx-air/utils';
import { launch, Browser, Page } from 'puppeteer';
import { after, afterEach } from 'mocha';
import { Compiler, ExampleSuiteApi } from '@tsx-air/types';
import { createTestServer, TestServer, loadSuite } from '@tsx-air/testing';
import ts from 'typescript';
import { browserify } from '@tsx-air/browserify';
import { join, basename, dirname } from 'path';
import rimraf from 'rimraf';
const examplePackage = dirname(require.resolve('@tsx-air/examples/package.json'));
const fixtures = join(examplePackage, 'fixtures');
const tempPath = join(__dirname, '../.tmp');

export function shouldCompileExamples(compiler: Compiler, examplePaths: string[]) {
    const examples = examplePaths.map(loadSuite);
    describe(`${compiler.label}: compiling examples`, function () {
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

        examples.map(
            ({ suite, path }) => {
                const exampleName = basename(path);
                const exampleTmpPath = join(tempPath, exampleName);

                describe(exampleName, () => {
                    // @ts-ignore
                    const api = new SuiteApiProxy();

                    before(async () => {
                        await browserifyBoilerplate(path, exampleTmpPath, compiler.transformers);
                    });
                    after(() => {
                        rimraf(exampleTmpPath, () => void (0));
                    });

                    beforeEach(async () => safely(async () => {
                        await Promise.all([
                            server.addStaticRoot(path),
                            server.addStaticRoot(exampleTmpPath),
                            server.addStaticRoot(fixtures)
                        ]);

                        api._api = {
                            page: await getBoilerPlatePage(server, browser),
                            server,
                            browser
                        };
                    }, 'Failed to compile example'));

                    suite.call(this, api);
                });
            });
    });
}

class SuiteApiProxy implements ExampleSuiteApi {
    public _api!: ExampleSuiteApi;
    get page() {
        return this._api.page;
    }
    get server() {
        return this._api.server;
    }
    get browser() {
        return this._api.browser;
    }
}

const browserifyBoilerplate = async (examplePath: string, target: string,
    transformers: ts.CustomTransformers) => await browserify({
        base: examplePath,
        entry: 'suite.boilerplate.ts',
        output: join(target, 'boilerplate.js'),
        debug: !!process.env.DEBUG,
        loaderOptions: {
            transformers,
            cache: false
        }
    });

async function getBoilerPlatePage(server: TestServer, browser: Browser): Promise<Page> {
    const page = await browser.newPage();
    const url = `${server.baseUrl}/suite.loader.html`;
    const pageErrors: Error[] = [];
    page.on('pageerror', (e: Error) => {
        pageErrors.push(e);
    });
    await page.goto(url);
    if (pageErrors.length) {
        throw new Error(`Test boilerplate page contains the following errors
        Tip: use "DEBUG=true yarn test" to debug in browser
        
        ${pageErrors.join('\'n')}`);
    }
    return page;
}
