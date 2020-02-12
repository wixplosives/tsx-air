import { Page, Browser } from 'puppeteer';
import { TestServer } from '../net';

export interface PreppeteerOptions {
    /**
     * @default "./fixtures"
     */
    fixtures: string | string[];
    
    /**
     * @default "/suite.loader.html"
     */
    url: string;
    
    /**
     * @default env.DEBUG
     */
    DEBUG: boolean;
    
    /**
     * @default 'loaded'
     */
    pageLoadedPredicate: (() => boolean) | 'loaded';
    
    /**
     * @default 'afterLoading'
     */
    startTests: 'beforeLoading' | 'domContentLoaded' | 'afterLoading';

    /**
     * @default 1
     */
    retries:number;
}

export interface PreppeteerSuiteApi {
    beforeLoading: Promise<Page>;
    domContentLoaded: Promise<Page>;
    afterLoading: Promise<Page>;
    server: TestServer;
    browser: Browser;
    pageErrors: Error[];
    timeout: number;
    readonly options:Readonly<PreppeteerOptions>;
}

