import { TestServer } from '@tsx-air/testing';
import { Page, Browser } from 'puppeteer';

export interface ExampleSuiteApi {
    page: Promise<Page>;
    server: TestServer;
    browser: Browser;
}

export interface ExampleSuite {
    suite: (api: ExampleSuiteApi) => void;
    path: string;
}