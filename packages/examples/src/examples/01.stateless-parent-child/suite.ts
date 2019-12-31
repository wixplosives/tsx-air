import { expect } from 'chai';
import { Page } from 'puppeteer';
import { ExampleSuite } from '../..';

const suite: ExampleSuite = {
    suite(getPage: (testTsx: string) => Promise<Page>) {
        return describe('01.stateless-parent-child', () => {
            it('should create a parent component with the correct name', async () => {
                const page = await getPage('./suite.boilerplate.ts');
                await Promise.all([
                    expect(page, `parent not found`).to.have.one('.parent'),
                    expect(page).to.have.one('.parent > .child'),
                    expect(page).to.have.one('.parent > *'),
                    expect(page.$('.parent')).to.have.text(`
                        Parent: Test
                        Child: Test`),
                    expect(page).to.have.one('.child'),
                    expect(page.$('.child')).to.have.text('Child: Test'),
                ]);
            });
        });
    },
    path: __dirname
};

export default suite;