import { expect } from 'chai';
import { Page } from 'puppeteer';
import { ExampleSuite } from '../../test.utils';
import { fail } from 'assert';

const suite: ExampleSuite = {
    suite(getPage: (testTsx: string) => Promise<Page>) {
        return describe('01.stateless-parent-child', () => {
            it('should create a parent component with the correct name', async () => {
                try {
                    const page = await getPage('./suite.boilerplate.ts');
                    const foundParent = await page.$$('.parent');
                    expect(foundParent, 'there can be only one (parent)').to.have.length(1);
                    expect(await page.$eval('.parent', (i: Element) => i.textContent)).to.equal('Parent: test');

                    const foundChild = await page.$$('.parent > .child');
                    expect(foundChild, 'there can be only one (child)').to.have.length(1);
                    expect(await page.$eval('.parent > .child', (i: Element) => i.textContent)).to.equal('Child: test');
                } catch (pageError) {
                    fail(pageError);
                }
            });
        });
    },
    path: __dirname
};

export default suite;