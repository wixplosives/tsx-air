import { ExampleSuiteApi, Features, feature } from '../07.dark.fader/node_modules/@tsx-air/types';
import { htmlMatch } from '../07.dark.fader/node_modules/@tsx-air/testing';
import { expect } from 'chai';

export const features: Features = [
    feature('dynamic', 'children'),
];

export function suite(api: ExampleSuiteApi) {
    it('loaded all the images', async () => {
        const page = await api.afterLoading;
        await htmlMatch(page, {
            cssQuery: 'img',
            pageInstances: 4
        });
        const src = await Promise.all(
            (await page.$$('img'))
                .map(img => img.getProperty('src').then(s => s.jsonValue())));
        const { baseUrl } = api.server;
        expect(src).to.eql([
            baseUrl + '/images/bunny.jpg',
            baseUrl + '/images/gradient.jpg',
            baseUrl + '/images/pretty-boy.jpg',
            baseUrl + '/images/weird.jpg',
        ]);
    });
}