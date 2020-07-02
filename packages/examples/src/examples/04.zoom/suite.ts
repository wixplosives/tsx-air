import flatMap from 'lodash/flatMap';
import { ExampleSuiteApi, ExamplePaths, feature } from '@tsx-air/types';
import { htmlMatch, loadPngs, matchImagesArray, moveMouseAndTakeSnapshot } from '@tsx-air/testing';
import { join } from 'path';


export const features = [
    feature('stateful', 'component'),
    feature('single', 'store'),
    feature('event', 'handler'),
    // feature('high', 'framerate'),
    feature('dom', 'ref')
];

export function suite(api: ExampleSuiteApi, paths: ExamplePaths) {
    it('should load the {url} image in two size', async () => {
        const page = await api.afterLoading;
        await htmlMatch(page, {
            cssQuery: '.zoom',
            children: [
                2,
                {
                    name: 'zoomed image',
                    cssQuery: '.zoomedIn', pageInstances: 1, descendants: [
                        { cssQuery: 'img[src="/images/gradient.jpg"]', scopeInstances: 1 }
                    ]
                },
                {
                    name: 'zoomed out image',
                    cssQuery: '.zoomedOut', pageInstances: 1, descendants: [
                        { cssQuery: 'img[src="/images/gradient.jpg"]', scopeInstances: 1 }
                    ]
                },
            ]
        });
    });

    describe('user interactions', () => {
        it('should move the zoomed image', async function () {
            this.timeout(30000);
            const matrixOf = (arr1: number[], arr2: number[]) =>
                flatMap(arr1, x => arr2.map(y => [x, y]));
            const mouseLocations = [
                [90, 50], // start inside the zoomed image
                ...matrixOf([30, 100, 150], [40, 120, 150]), // move around the zoomed image
                [300, 300], [300, 400]]; // move around outside the zoomed image
            const namesOfLocations = mouseLocations.map(([x, y]: number[]) => `zoomedIn-${x}-${y}.png`);
            const expected = loadPngs(namesOfLocations.map(f => join(paths.path, 'expected', f)), 1000 / 60);
            await (await api.beforeLoading).setViewport({
                height: 1000, width: 1000
            });

            const page = await api.afterLoading;
            const zoomedIn = (await page.$('.zoomedIn'))!;
            const actual = moveMouseAndTakeSnapshot(mouseLocations, page, zoomedIn);
            await matchImagesArray(expected, actual, namesOfLocations, paths.temp);
        });
    });
}