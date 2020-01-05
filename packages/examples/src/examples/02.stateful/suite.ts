import { Page } from 'puppeteer';
import { ExampleSuite } from '../..';
import { htmlMatch } from '@tsx-air/testing';

const suite: ExampleSuite = {
    suite(getPage: (testTsx: string) => Promise<Page>) {
        return describe('01.stateless-parent-child', () => {
            it('should create a parent component with the correct name', async () => {
                const page = await getPage('./suite.boilerplate.ts');
            });
        });
    },
    path: __dirname
};

export default suite;