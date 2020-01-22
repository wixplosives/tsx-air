import { ExampleSuiteApi } from '@tsx-air/types';
import { htmlMatch } from '@tsx-air/testing';

export default function (api:ExampleSuiteApi) {
    it('should create a parent component with the correct name', async  () => {
        const page = await api.afterLoading;
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
        const page = await api.afterLoading;
        await page.evaluate(() => (window as any).app.updateProps({ name: 'changed' }));
        // tslint:disable: no-console
        console.log('A1');
        await page.waitFor(50);
        console.log('A2');
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
        console.log('A3');

    });
}