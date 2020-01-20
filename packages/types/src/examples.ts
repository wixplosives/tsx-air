import { TestServer } from '@tsx-air/testing/src/net/testserver';
import { Page } from 'puppeteer';

export interface ExampleSuiteApi {
    page: Page;
    getPage: GetPage;
    server: TestServer;
}

export interface ExampleSuite {
    suite: (api: ExampleSuiteApi) => void;
    path: string;
}
export type GetPage = (testHtml: string) => Promise<Page>;
