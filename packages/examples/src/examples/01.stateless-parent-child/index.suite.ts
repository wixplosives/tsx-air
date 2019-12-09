import { expect } from 'chai';
import { Page } from 'puppeteer';
import { ExampleSuite } from '../../test.utils';

const suite: ExampleSuite = {
    suite(getPage: (testTsx: string) => Promise<Page>) {
        return describe('01.stateless-parent-child', () => {
            it.only('should create a parent component with the correct name', async () => {
                const page = await getPage('./index.suite.boilerplate.js');
                const foundParent = await page.$$('.parent');
                expect(foundParent, 'there can be only one (parent)').to.have.length(1);
                expect(await page.$eval('.parent', (i: Element) => i.textContent)).to.equal('Parent: test');

                const foundChild = await page.$$('.parent > .child');
                expect(foundChild, 'there can be only one (child)').to.have.length(1);
                expect(await page.$eval('.parent > .child', (i: Element) => i.textContent)).to.equal('Child: test');
            });
        });
    },
    path: __dirname
};

export default suite;