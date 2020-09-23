import { ExampleSuiteApi, feature, Features } from '@tsx-air/types';
import { htmlMatch } from '@tsx-air/testing';
import { Page } from 'puppeteer';

export const features: Features = [
    feature('stateless', 'component'),
    feature('lifeCycle', 'api', 'afterDomUpdate'),
    feature('lifeCycle', 'api', 'afterMount'),
];

export function suite(api: ExampleSuiteApi) {
    const setClientTime = (page: Page, time: string) => {
        return page.waitForFunction((t: string) => {
            // @ts-ignore
            globalThis.Date = class {
                toTimeString = () => t;
            };
            return true;
        }, { polling: 'mutation', timeout: 1000 }, time);
    };

    it('calls the afterMounted callback', async () => {
        const page = await api.afterLoading;
        await htmlMatch(page, {
            cssQuery: '.time',
            textContent: {
                contains: 'Not set'
            }
        });
        await setClientTime(page, 'MOCK TIME');
        await htmlMatch(page, {
            cssQuery: '.time',
            textContent: {
                doesNotContain: 'Not set',
                contains: 'MOCK TIME'
            }
        });
    });

    it('passes the dom root to afterMounted callback', async () => {
        const page = await api.afterLoading;
        await htmlMatch(page, {
            cssQuery: 'a[href="#"]:focus',
            scopeInstances: 1
        });
    });

    it('calls the afterDomUpdate callback with a filter', async () => {
        const page = await api.afterLoading;
        await htmlMatch(page, {
            cssQuery: 'h3',
            textContent: {
                contains: 'Title updated 1 times'
            }
        });
        await page.waitForFunction(() => ((window as any).app.updateProps({ title: 'changed' }), true), { polling: 'mutation', timeout: 1000 });
        await htmlMatch(page, {
            cssQuery: 'h3',
            textContent: {
                contains: 'Title updated 2 times'
            }
        });
    });

    it('passes consecutiveChanges argument to afterDomUpdate callback', async () => {
        const page = await api.afterLoading;
        await setClientTime(page, 'MOCK TIME');
        await htmlMatch(page, {
            cssQuery: '.any-updated',
            name: 'total updates',
            textContent: {
                contains: 'Total updates: 20'
            }
        });
        await setClientTime(page, 'NEW MOCK TIME');
        await htmlMatch(page, {
            cssQuery: '.any-updated',
            textContent: {
                contains: 'Total updates: 30'
            }
        });
    });
}