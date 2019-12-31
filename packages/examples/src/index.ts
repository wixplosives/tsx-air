import { Page } from 'puppeteer';

export { shouldBeCompiled, manuallyCompiledOnly } from './examples';


export interface ExampleSuite {
    suite: (getPage: (testTsx: string) => Promise<Page>) => Mocha.Suite;
    path: string;
}
export type GetPage = (testHtml: string) => Promise<Page>;