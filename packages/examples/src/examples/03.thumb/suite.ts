import { ExampleSuiteApi } from '@tsx-air/types';
import { htmlMatch } from '@tsx-air/testing';
import { delay } from '@tsx-air/utils';

const onlyPreloader = {
    cssQuery: '.thumb',
    pageInstances: 1,
    children: [{
        name: 'Preloader',
        cssQuery: '.preloader',
        pageInstances: 1,
        scopeInstances: 1
    }]
};

const onlyImage = {
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
};

export default function (api: ExampleSuiteApi) {
    it('should start with a preloader, then show only the image', async () => {
        const { page: p, server } = api;
        const serveImages = await server.setDelay(/.*\.jpg/, 9999999);
        const page = await p;
        await htmlMatch(page, onlyPreloader);
        serveImages();
        await page.waitForResponse(`${server.baseUrl}/images/pretty-boy.jpg`);
        await delay(50);
        await htmlMatch(page, onlyImage);
    });

    it('should repeat the loading sequence when the image changes', async () => {
        const { page: p, server } = api;
        const page = await p;
        await page.waitForResponse(`${server.baseUrl}/images/pretty-boy.jpg`);
        // Now let's update the props
        const serveImages = await server.setDelay(/.*\.jpg/, 9999999);
        await page.evaluate(() => (window as any).app.updateProps({ url: '/images/weird.jpg' }));
        await delay(50);
        await htmlMatch(page, onlyPreloader);
        serveImages();
        await page.waitForResponse(`${server.baseUrl}/images/weird.jpg`);        await delay(50);
        await delay(50);
        await htmlMatch(page, onlyImage);
    });
}