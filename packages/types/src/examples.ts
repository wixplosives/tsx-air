import { TestServer } from '@tsx-air/testing';
import { Page, Browser } from 'puppeteer';

export interface ExampleSuiteApi {
    beforeLoading: Promise<Page>;
    domContentLoaded: Promise<Page>;
    afterLoading: Promise<Page>;
    server: TestServer;
    browser: Browser;
}

export interface ExampleSuite {
    suite: (api: ExampleSuiteApi) => void;
    path: string;
}