import { join, dirname } from 'path';
import { ExampleSuiteApi } from '@tsx-air/types';
import { htmlMatch } from '@tsx-air/testing';

export default function (api:ExampleSuiteApi) {
    it('should start with a preloader', async () => {
        const { page } = api;
        await htmlMatch(page, {
            cssQuery: '.thumb',
            pageInstances: 1,
            children: [{
                name: 'Preloader',
                cssQuery: '.preloader',
                scopeInstances: 1
            }]
        });
    });
    it('should change to image once loaded', async () => {
        const { page } = api;
        await page.waitFor(200);
        await htmlMatch(page, {
            cssQuery: '.thumb',
            pageInstances: 1,
            children: [{
                name: 'Image',
                cssQuery: 'img',
                scopeInstances: 1
            },
            {
                name:'Preloader',
                cssQuery: '.preloader',
                scopeInstances: 0
            }]
        });
    });
}