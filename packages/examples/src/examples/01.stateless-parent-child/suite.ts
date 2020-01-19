import { htmlMatch } from '@tsx-air/testing';

export default function () {
    it('should create a parent component with the correct name', async function () {
        const { page } = this;
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
    it('should update the view', async function () {
        const { page } = this;
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
}