import { ExampleSuiteApi, Features, feature } from '@tsx-air/types';
import { htmlMatch } from '@tsx-air/testing';
import { delay } from '@tsx-air/utils';
import { expect } from 'chai';

export const features: Features = [
    feature('stateful', 'component'),
    feature('single', 'store'),
    feature('event', 'handler'),
    feature('when', 'props', 'change', 'handler'),
    // feature('memo'),
    feature('lambda', 'handler'),
    feature('conditional', 'dom'),
];

export function suite(api: ExampleSuiteApi) {
    it('starts with a preloader, then show only the image', async () => {
        const { afterLoading, server } = api;
        const serveImages = await server.setDelay(/.*\.jpg/, 9999999);
        const page = await afterLoading;
        await htmlMatch(page, onlyPreloader);
        serveImages();
        await page.waitForResponse(`${server.baseUrl}/images/pretty-boy.jpg`);
        await delay(50);
        await htmlMatch(page, onlyImage);
    });

    it('should repeat the loading sequence when the image changes', async () => {
        const { beforeLoading: p, server } = api;
        const page = await p;
        await page.waitForResponse(`${server.baseUrl}/images/pretty-boy.jpg`);
        // Now let's update the props
        const serveImages = await server.setDelay(/.*\.jpg/, 9999999);
        await page.evaluate(() => (window as any).app.setProp('imageId', 'weird'));
        await delay(50);
        await htmlMatch(page, onlyPreloader);
        serveImages();
        await page.waitForResponse(`${server.baseUrl}/images/weird.jpg`);
        await delay(50);
        await htmlMatch(page, onlyImage);
    });

    it('re-evaluate memo only when imageId changes', async () => {
        const page = await api.beforeLoading;
        await page.waitForResponse(`${api.server.baseUrl}/images/pretty-boy.jpg`);
        await htmlMatch(page, {
            name: 'title', cssQuery: '.title', textContent: 'pretty-boy', pageInstances: 1
        });
        await htmlMatch(page, {
            name: 'image title', cssQuery: 'img[title="I love you dadio"]', pageInstances: 1
        });
        await page.evaluate(() => (window as any).app.setProp('resolution', 'low'));
        await page.waitForResponse(`${api.server.baseUrl}/low-res/pretty-boy.jpg`);
        await page.evaluate(() => (window as any).app.updateProps({ imageId: 'weird', resolution: 'high' }));
        await page.waitForResponse(`${api.server.baseUrl}/images/weird.jpg`);
        await page.waitFor(50);
        await htmlMatch(page, {
            name: 'updated image title', cssQuery: `img[title="I'm feeling much better now"]`, pageInstances: 1
        });

        const reqs = api.server.log
            .map(({ url }) => url)
            .filter(url => url.endsWith('.json') || url.endsWith('.jpg'));
        expect(reqs, 'metadata memoized').to.eql([
            '/meta/pretty-boy.json',
            '/images/pretty-boy.jpg',
            '/low-res/pretty-boy.jpg',
            '/meta/weird.json',
            '/images/weird.jpg',
        ]);
    });
}


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