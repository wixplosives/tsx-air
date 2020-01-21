import { ExampleSuiteApi } from '@tsx-air/types';
import { htmlMatch } from '@tsx-air/testing';

export default function (api:ExampleSuiteApi) {    
    it('should start with a preloader', async () => {
        const { page, server } = api;
        server.addEndpoint('/images/pretty-boy.jpg', 'invaid image');
        await htmlMatch(await page, {
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
        const page  = await api.page;
        await page.waitFor(50);
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
    xit('should repeat the loading sequence when the image changes', async () => {
        const page = await api.page;
        await page.evaluate(() => (window as any).app.updateProps({ url: '/weird.jpg'}));
        await page.waitFor(50);
        await htmlMatch(page, {
            name:'Thumb',
            cssQuery: '.thumb',
            pageInstances: 1,
            children: [{
                name: 'Preloader',
                cssQuery: '.preloader',
                scopeInstances: 1
            }]
        });
        await page.waitFor(200);
        await htmlMatch(page, {
            name:'Thumb',
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