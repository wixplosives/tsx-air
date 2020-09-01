import { ExampleSuiteApi, feature, Features } from '@tsx-air/types';
import { htmlMatch } from '@tsx-air/testing';

export const features: Features = [
    feature('stateless', 'component'),
    feature('lifeCycle', 'api', 'afterDomUpdate'),
    feature('lifeCycle', 'api', 'afterMount'),
];

export function suite(api: ExampleSuiteApi) {
    it('calls the afterMounted callback', async () => {
        const page = await api.afterLoading;
        await htmlMatch(page, {
            cssQuery: '.time',
            textContent: {
                contains: 'Not set'
            }
        });
        await page.waitFor(process.env.CI ? 300 : 100);
        await htmlMatch(page, {
            cssQuery: '.time',
            textContent: {
                doesNotContain: 'Not set',
                contains: 'GMT'
            }
        });
    });

    it('calls the afterDomUpdate callback', async () => {
        const page = await api.afterLoading;
        await htmlMatch(page, {
            cssQuery: 'h3',
            textContent: {
                contains: 'Title updated 1 times'
            }
        });
        await page.evaluate(() => (window as any).app.updateProps({ title: 'changed' }));
        await page.waitFor(50);
        await htmlMatch(page, {
            cssQuery: 'h3',
            textContent: {
                contains: 'Title updated 2 times'
            }
        });
    });
}