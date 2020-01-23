import { expect } from 'chai';
import { PreppeteerSuiteApi, PreppeteerOptions } from './puppeteer.mocha.types';
import { TestServer, createTestServer } from '../net';
import { launch, Browser } from 'puppeteer';
import { isArrayOf } from '@tsx-air/utils';
import defaults from 'lodash/defaults';
import { Socket } from 'net';

export function preppeteer(options?: Partial<PreppeteerOptions>): PreppeteerSuiteApi {
    const api = {} as PreppeteerSuiteApi;
    const opt = defaults(options, {
        fixtures: './fixtures',
        url: '/suite.loader.html',
        DEBUG: !!process.env.DEBUG,
        pageLoadedPredicate: 'loaded',
        startTests: 'afterLoading',
        retries: (mocha.options.retries || 0) + 2,
    } as PreppeteerOptions);

    if (!isArrayOf(opt.fixtures, 'string')) {
        expect(opt.fixtures).to.be.a('string');
        opt.fixtures = [opt.fixtures as string];
    }

    const getBrowser = () => launch({ headless: !opt.DEBUG, devtools: opt.DEBUG });
    const addFixtures = (s: TestServer) => Promise.all((opt.fixtures as string[])
        .map(f => s.addStaticRoot(f)));

    let browser: Promise<Browser>;
    let server: Promise<TestServer>;
    let timeout: number | undefined;

    before(async function () {
        this.currentTest?.retries(opt.retries);
        browser = getBrowser();
        server = createTestServer();
    });

    beforeEach(async function () {
        timeout = timeout || this.currentTest?.timeout() || 5000;
        this.currentTest?.timeout(timeout);
        const s = await server;
        await s.reset().then(() => addFixtures(s));
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
    });

    afterEach(() => {
        try {
            api.browser.pages().then(p => p.forEach(i => i.close().catch(() => null)));
        } catch {
            // don't care
        }
    });

    afterEach(async function () {
        if (this.currentTest?.timedOut) {
            this.timeout(5000);
            try {
                const s = new Socket();
                const old = api.browser;
                api.browser.close().catch(() => old.disconnect());
            } catch { /* */ }
            browser = getBrowser();
            await browser;
            // tslint:disable: no-console
            console.warn('Stared a new instance of puppeteer');
            timeout = timeout! + 2000;
        }
    });

    after(() => {
        // tslint:disable: no-unused-expression
        api.server && api.server.close().catch(() => null);
        return api.browser && api.browser.close().catch(() => null);
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