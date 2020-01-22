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
const publicPath = join(examplePackage, 'public');
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
                            server.addStaticRoot(fixtures),
                            server.addStaticRoot(publicPath)
                        ]);
                        api._api = {
                            ...await getBoilerPlatePage(server, browser),
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
    get beforeLoading() {
        return this._api.beforeLoading;
    }

    get afterLoading() {
        return this._api.afterLoading;
    }
    get domContentLoaded() {
        return this._api.domContentLoaded;
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

async function getBoilerPlatePage(server: TestServer, browser: Browser) {
    const page = browser.newPage();
    const url = `${server.baseUrl}/suite.loader.html`;
    const pageErrors: Error[] = [];
    (await page).on('pageerror', (e: Error) => {
        pageErrors.push(e);
    });

    const verify = () => {
        if (pageErrors.length) {
            throw new Error(`Test boilerplate page contains the following errors
        Tip: use "DEBUG=true yarn test" to debug in browser
        
        ${pageErrors.join('\'n')}`);
        }
        return page as Promise<Page>;
    };

    const domContentLoaded = page.then(p => p.goto(url, { waitUntil: 'domcontentloaded' })).then(verify);
    const afterLoading = domContentLoaded.then(p =>
        p.waitForFunction(() => (window as any).app, { polling: 10 }))
        .then(() => page);

    return {
        beforeLoading: page,
        afterLoading,
        domContentLoaded
    };
}
