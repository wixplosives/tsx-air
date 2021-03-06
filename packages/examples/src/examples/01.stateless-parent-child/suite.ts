import { ExampleSuiteApi, feature, Features } from '@tsx-air/types';
import { htmlMatch } from '@tsx-air/testing';

export const features: Features = [
    feature('stateless', 'component'),
    feature('imperative', 'update', 'component'),
    feature('declarative', 'update', 'nested', 'component'),
    feature('nested', 'stateless', 'component'),
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
        await page.waitForFunction(
            () => ((window as any).app.updateProps({ name: 'changed' }), true),
            { polling: 'mutation', timeout: 300 });
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