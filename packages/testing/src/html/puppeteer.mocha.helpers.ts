import { delay } from '@tsx-air/utils';
import { PreppeteerSuiteApi, PreppeteerOptions } from './puppeteer.mocha.types';
import { TestServer } from '../net';
import { launch, Browser } from 'puppeteer';

export function getNewPage(server: TestServer, browser: Browser, options: PreppeteerOptions, timeout: number): PreppeteerSuiteApi {
    if (!browser.isConnected()) {
        throw new Error('Browser is disconnected');
    }
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
        pageErrors,
        options,
        timeout
    };
}

export const getBrowser = (debug: boolean) => launch({ headless: !debug, devtools: debug });
export const killBrowser = async (browser: Browser) => {
    if (browser.isConnected()) {
        const res = await Promise.race([
            browser.close().then(() => 'CLOSED').catch(() => 'ERR'),
            delay(2000)]);
        if (res !== 'CLOSED') {
            browser.disconnect();
            browser.process().kill();
        }
    } else {
        if (browser.process()) {
            browser.process().kill();
        }
    }
};


export function cleanupPuppeteer(api: PreppeteerSuiteApi) {
    return async function (this: Mocha.Context) {
        const restartBrowser = async () => {
            this.timeout(5000);
            killBrowser(api.browser);
            this.browser = api.browser = await getBrowser(api.options.DEBUG);
            // tslint:disable-next-line: no-console
            console.warn('Stared a new instance of puppeteer');
            // clearly this system needs more help
            api.timeout = api.timeout! + 2000;
        };

        if (this.currentTest?.timedOut) {
            await restartBrowser();
        } else {
            const { tests } = this.currentTest!.parent!;
            if (this.currentTest !== tests[tests.length - 1]) {
                if (api.browser.isConnected()) {
                    api.browser.pages()
                        .then(pages => pages.forEach(
                            (page, i) => i > 0
                                ? page.close().catch(() => null)
                                : null))
                        .catch(() => null);
                } else {
                    await restartBrowser();
                }
            }
        }
    };
}

export class ApiProxy implements Readonly<PreppeteerSuiteApi> {
    get beforeLoading() { return this._api.beforeLoading; }
    get afterLoading() { return this._api.afterLoading; }
    get domContentLoaded() { return this._api.domContentLoaded; }
    get server() { return this._api.server; }
    get browser() { return this._api.browser; }
    get pageErrors() { return this._api.pageErrors; }
    get timeout() { return this._api.timeout + this.extraTimeout; }
    set timeout(newTimeout) { this.extraTimeout = newTimeout - this.timeout; }
    private extraTimeout = 0;
    constructor(private readonly _api: PreppeteerSuiteApi, public readonly options: PreppeteerOptions) { }
}


export function assertNoPageErrors(api: PreppeteerSuiteApi) {
    return function (this: Mocha.Context) {
        if (this.currentTest && api.pageErrors.length > 0) {
            api.pageErrors.forEach(e => {
                e.message = `Test page contains the following errors
    Tip: use "DEBUG=true yarn test" to debug in browser\n${e.message}`;
                this.currentTest!.emit('error', e);
            });
        }
    };
}