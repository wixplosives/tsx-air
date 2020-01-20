import { join, dirname } from 'path';
import { ExampleSuiteApi } from '@tsx-air/types';
import { htmlMatch } from '@tsx-air/testing';

export default function (api:ExampleSuiteApi) {
    beforeEach(async () => {
        const pub = join(dirname(require.resolve('@tsx-air/examples/package.json')), 'public');
        await api.server.addStaticRoot(pub);
    });

    it('should start with a preloader', async () => {
        const { page } = api;
        await htmlMatch(page, {
            cssQuery: '.thumb',
            pageInstances: 1,
            children: [{
                cssQuery: '.preloader',
                scopeInstances: 1
            }]
        });
    });
    // it('should change to image once loaded', async () => {
    //     const { page } = api;
    //     await page.evaluate(() => {
    //         (window as any).app.updateProps({ url: '/images/prettyboy.jpg' });
    //     });
    //     await page.waitFor(500);
    //     await htmlMatch(page, {
    //         cssQuery: '.thumb',
    //         pageInstances: 1,
    //         children: [{
    //             cssQuery: 'img',
    //             scopeInstances: 1
    //         },
    //         {
    //             cssQuery: '.preloader',
    //             scopeInstances: 0
    //         }]
    //     });
    // });
}