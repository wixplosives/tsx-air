import { expect } from 'chai';
import { PreppeteerSuiteApi, PreppeteerOptions } from './puppeteer.mocha.types';
import { TestServer, createTestServer } from '../net';
import { Browser } from 'puppeteer';
import { isArrayOf } from '@tsx-air/utils';
import defaults from 'lodash/defaults';
import { ApiProxy, getBrowser, getNewPage, cleanupPuppeteer, assertNoPageErrors, killBrowser } from './puppeteer.mocha.helpers';

export function preppeteer(options?: Partial<PreppeteerOptions>): PreppeteerSuiteApi {
    const api = {} as PreppeteerSuiteApi;
    const opt = defaults(options, {
        fixtures: './fixtures',
        url: '/suite.loader.html',
        DEBUG: !!process.env.DEBUG,
        pageLoadedPredicate: 'loaded',
        startTests: 'afterLoading',
        retries: 3,
    } as PreppeteerOptions);

    if (!isArrayOf(opt.fixtures, 'string')) {
        expect(opt.fixtures).to.be.a('string');
        opt.fixtures = [opt.fixtures as string];
    }

    const addFixtures = (s: TestServer) => Promise.all((opt.fixtures as string[])
        .map(f => s.addStaticRoot(f)));
    let browser: Promise<Browser>;
    let server: Promise<TestServer>;

    before(() => {
        browser = getBrowser(opt.DEBUG);
        server = createTestServer();
    });

    beforeEach(async function () {
        this.currentTest?.retries(opt.DEBUG ? 1 : this.currentTest?.retries() + opt.retries);
        const s = await server;
        await s.reset().then(() => addFixtures(s));
        Object.assign(api, getNewPage(await server, await browser, opt, this.currentTest!.timeout()));
        this.currentTest?.timeout(api.timeout);
    });

    afterEach(assertNoPageErrors(api));
    afterEach(cleanupPuppeteer(api));
    after(async () => Promise.all([
        await api.server.close().catch(() => null),
        await killBrowser(api.browser)
    ]));

    return new ApiProxy(api, opt);
}
