import { expect } from 'chai';
import { PreppeteerSuiteApi, PreppeteerOptions } from './puppeteer.mocha.types';
import { TestServer, createTestServer } from '../net';
import { ElementHandle, Page } from 'puppeteer';
import { isArrayOf, delay } from '@tsx-air/utils';
import defaults from 'lodash/defaults';
import { ApiProxy, getBrowser, getNewPage, cleanupPuppeteer, assertNoPageErrors, killBrowser } from './puppeteer.mocha.helpers';
import { PNG } from 'pngjs';

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

    before(function () {
        this.browser = getBrowser(opt.DEBUG);
        this.server = createTestServer();
    });

    beforeEach(async function () {
        this.retries(1);
        const s = await this.server;
        await s.reset().then(() => addFixtures(s));
        Object.assign(api, getNewPage(
            await this.server,
            await this.browser,
            opt,
            this.currentTest!.timeout()));

        this.currentTest?.retries(opt.DEBUG ? 1 : this.currentTest?.retries() + opt.retries);
        this.currentTest?.timeout(api.timeout);
    });

    afterEach(assertNoPageErrors(api));
    afterEach(cleanupPuppeteer(api));
    after(() => Promise.all([
        api.server.close().catch(() => null),
        killBrowser(api.browser)
    ]));

    return new ApiProxy(api, opt);
}

export function moveMouseAndTakeSnapshot(
    locations: number[][], page: Page, target: ElementHandle): Array<Promise<PNG>> {
    let last = Promise.resolve() as unknown as Promise<PNG>;
    return locations.map(([x, y]) =>
        last = last
            .then(() => page.mouse.move(x, y, { steps: 20 }))
            .then(() => delay(1000 / 60))
            .then(() => target.screenshot({
                encoding: 'binary',
                type: 'png'
            }).then(data => PNG.sync.read(data))
            ));
}