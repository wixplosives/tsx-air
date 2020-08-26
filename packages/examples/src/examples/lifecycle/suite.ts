import { ExampleSuiteApi, feature, Features } from '@tsx-air/types';
import { htmlMatch } from '@tsx-air/testing';

export const features: Features = [
    feature('stateless', 'component'),
    // feature('lifeCycle', 'api'),
];

export function suite(api: ExampleSuiteApi) {
    it('should create a parent component with the correct name', async () => {
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