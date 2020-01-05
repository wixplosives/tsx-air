import { Page } from 'puppeteer';
import {Suite} from 'mocha';

export interface ExampleSuite {
    suite: (getPage: (testTsx: string) => Promise<Page>) => Suite;
    path: string;
}
export type GetPage = (testHtml: string) => Promise<Page>;
