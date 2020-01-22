import { ExampleSuiteApi } from '@tsx-air/types';
import { htmlMatch } from '@tsx-air/testing';
import { delay } from '@tsx-air/utils';

export default function (api:ExampleSuiteApi) {    
    it('should start with a preloader, then show only the image', async () => {
        const { page:p, server } = api;
        const serveImage = await server.setDelay(/.*\.jpg/, 9999999);        
        const page = await p;
        await htmlMatch(page, {
            cssQuery: '.thumb',
            pageInstances: 1,
            children: [{
                name: 'Preloader',
                cssQuery: '.preloader',
                scopeInstances: 1
            }]
        });
        serveImage();
        await page.waitForResponse(`${server.baseUrl}/images/pretty-boy.jpg`);
        await delay(50);
        await htmlMatch(await page, {
            cssQuery: '.thumb',
            pageInstances: 1,
            children: [{
                name: 'Image',
                cssQuery: 'img',
                scopeInstances: 1
            },
            {
                name: 'Preloader',
                cssQuery: '.preloader',
                scopeInstances: 0
            }]
        });
    });
   
    it('should repeat the loading sequence when the image changes', async () => {
        const page = await api.page;
        await page.evaluate(() => (window as any).app.updateProps({ url: '/missing.jpg'}));
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