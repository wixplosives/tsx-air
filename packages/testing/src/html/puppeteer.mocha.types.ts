import { Page, Browser } from 'puppeteer';
import { TestServer } from '../net';

export interface PuppeteerSuiteOptions {
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
     * @default 4
     */
    retries:number;
}

export interface PuppeteerSuiteApi {
    beforeLoading: Promise<Page>;
    domContentLoaded: Promise<Page>;
    afterLoading: Promise<Page>;
    server: TestServer;
    browser: Browser;
    pageErrors: Error[];
}

