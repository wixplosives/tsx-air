import { Page } from 'puppeteer';
import { htmlMatch } from '@tsx-air/testing';

export default function(getPage: (testTsx: string) => Promise<Page>) {
    return describe('01.stateless-parent-child', () => {
        it('should create a parent component with the correct name', async () => {
            const page = await getPage('./suite.boilerplate.ts');
            await htmlMatch(page, {
                cssQuery: '.parent',
                pageInstances: 1,
                textContent: {
                    contains: 'Parent: Test'
                },
                children: [{
                    cssQuery: '.child',
                    pageInstances: 1,
                    scopeInstances: 1,
                    textContent: 'Child: Test'
                }]
            });
        });
        it('should update the view', async () => {
            const page = await getPage('./suite.boilerplate.ts');
            await page.evaluate(() => (window as any).app.updateProps({ name: 'changed' }));
            await page.waitFor(50);
            await htmlMatch(page, {
                cssQuery: '.parent',
                pageInstances: 1,
                textContent: {
                    contains: 'Parent: changed'
                },
                children: [{
                    cssQuery: '.child',
                    pageInstances: 1,
                    scopeInstances: 1,
                    textContent: 'Child: changed'
                }]
            });
        });
    });
}