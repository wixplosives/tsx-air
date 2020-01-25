import { ExamplePaths } from './../../../../types/src/examples';
import flatMap from 'lodash/flatMap';
import { delay } from './../../../../utils/src/promises';
import { ExampleSuiteApi } from '@tsx-air/types';
import { htmlMatch } from '@tsx-air/testing';
// @ts-ignore
import BlinkDiff from 'blink-diff';
import { join } from 'path';

export default function (api: ExampleSuiteApi, paths: ExamplePaths) {
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
            this.timeout(20000);
            await (await api.domContentLoaded).setViewport({
                height: 1000, width: 1000
            });
            const page = await api.afterLoading;
            const zoomedIn = (await page.$('.zoomedIn'))!;

            const moveMouse = async (steps: number[][]) => {
                for (const [x, y] of steps) {
                    await page.mouse.move(x, y, { steps: 20 });
                    delay(50);
                    await zoomedIn.screenshot({
                        encoding: 'binary',
                        path: `${paths.temp}/${toPath([x, y])}`,
                        // path: `${paths.path}/expected/${toPath([x, y])}`,
                    });
                }
            };

            const toPath = ([x, y]: number[]) => `zoomedIn-${x}-${y}.png`;

            const matrixOf = (arr1: number[], arr2: number[]) =>
                flatMap(arr1, x =>
                    arr2.map(y => [x, y]));

            const mouse = [[90, 50], ...matrixOf([30, 100, 150], [40, 120, 150]), [300, 300], [300, 400]];
            await moveMouse(mouse);
            await Promise.all(mouse.map(toPath).map(path =>
                new Promise(async (resolve, reject) => {
                    const diff = new BlinkDiff({
                        imageBPath: join(paths.temp, path),
                        imageAPath: join(paths.path, 'expected', path),
                        thresholdType: BlinkDiff.THRESHOLD_PERCENT,
                        delta: 50,
                        threshold: 0.1,
                        composition: false,
                        imageOutputPath: join(paths.temp, 'diff-' + path),
                    });
                    diff.run((err: Error, result: any) => {
                        if (err) {
                            return reject(err);
                        }
                        if (diff.hasPassed(result.code)) {
                            resolve();
                        } else {
                            reject(new Error(`Failed image comparison ${path}`));
                        }
                    });
                })));
        });
    });
}