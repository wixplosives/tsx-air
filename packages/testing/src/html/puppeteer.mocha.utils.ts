import { expect } from 'chai';
import { PuppeteerSuiteApi as PreppeteerSuiteApi, PuppeteerSuiteOptions as PreppeteerOptions } from './puppeteer.mocha.types';
import { TestServer, createTestServer } from '../net';
import { launch, Browser } from 'puppeteer';
import { isArrayOf } from '@tsx-air/utils';
import defaults from 'lodash/defaults';

export function preppeteer(options?: Partial<PreppeteerOptions>): PreppeteerSuiteApi {
    const api = {} as PreppeteerSuiteApi;
    const opt = defaults(options, {
        fixtures: './fixtures',
        url: '/suite.loader.html',
        DEBUG: !!process.env.DEBUG,
        pageLoadedPredicate: 'loaded',
        startTests: 'afterLoading',
        retries: 4
    } as PreppeteerOptions);

    if (!isArrayOf(opt.fixtures, 'string')) {
        expect(opt.fixtures).to.be.a('string');
        opt.fixtures = [opt.fixtures as string];
    }

    let browser: Promise<Browser>;
    let server: Promise<TestServer>;

    before(async function () {
        this.currentTest?.retries(opt.retries);
        browser = launch({ headless: !opt.DEBUG, devtools: opt.DEBUG });
        (await browser).on('disconnected', () => {
            // tslint:disable-next-line: no-console
            console.error('DDDISCONNNECCTEd');
        });
        const _server = createTestServer();
        server = _server.then(s =>
            Promise.all((opt.fixtures as string[])
                .map(f => s.addStaticRoot(f)))
        ).then(() => _server);
    });

    beforeEach(async () => {
        Object.assign(api, getNewPage(await server, await browser, opt));
    });

    afterEach(function () {
        if (this.currentTest && api.pageErrors.length > 0) {
            api.pageErrors.forEach(e => {
                e.message = `Test page contains the following errors
    Tip: use "DEBUG=true yarn test" to debug in browser\n${e.message}`;
                this.currentTest!.emit('error', e);
            });
        }
        try {
            api.browser.pages().then(p => p.forEach(i => i.close().catch(() => null)));
        } catch {
            // don't care
        }
    });
    after(() => {
        // tslint:disable: no-unused-expression
        api.server && api.server.close().catch(() => null);
        api.browser && api.browser.close().catch(() => null);
    });

    return new ApiProxy(api);
}

function getNewPage(server: TestServer, browser: Browser, options: PreppeteerOptions): PreppeteerSuiteApi {
    const page = browser.newPage();
    const pageErrors: Error[] = [];
    const wasLoaded = new Promise(resolve =>
        page.then(p => {
            p.on('pageerror', (e: Error) => pageErrors.push(e));
            p.once('load', () => resolve());
        }));

    const domContentLoaded = page
    .then(p => p.goto(server.baseUrl + options.url, { waitUntil: 'domcontentloaded' }))
    .then(r => {
        const status = r?.status();
        if (status === 200) {
            return page;
        }
        throw new Error(`Bas url (status ${status}): ${server.baseUrl + options.url}`);
    });
    const afterLoading = domContentLoaded.then(p =>
        options.pageLoadedPredicate === 'loaded' ? wasLoaded :
            p.waitForFunction(options.pageLoadedPredicate, { polling: 10 }))
        .then(() => page);

    return {
        server,
        browser,
        beforeLoading: page,
        afterLoading,
        domContentLoaded,
        pageErrors
    };
}


class ApiProxy implements PreppeteerSuiteApi {
    constructor(private readonly _api: PreppeteerSuiteApi) { }
    get beforeLoading() { return this._api.beforeLoading; }
    get afterLoading() { return this._api.afterLoading; }
    get domContentLoaded() { return this._api.domContentLoaded; }
    get server() { return this._api.server; }
    get browser() { return this._api.browser; }
    get pageErrors() { return this._api.pageErrors; }
}
