import { TestServer } from './../../testing/src/net/testserver';
import { Page } from 'puppeteer';
import {Suite} from 'mocha';


export interface ExampleSuite {
    suite: () => void;
    path: string;
}
export type GetPage = (testHtml: string) => Promise<Page>;
