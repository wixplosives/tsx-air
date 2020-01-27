import { PNG } from 'pngjs';
import { join } from 'path';
import { createReadStream, createWriteStream } from 'fs';
import pixelmatch from 'pixelmatch';
import { expect } from 'chai';
import { delay } from '@tsx-air/utils/src';

type RGBTuple = [number, number, number];
interface PMOptions {
    /** Matching threshold, ranges from 0 to 1. Smaller values make the comparison more sensitive. 0.1 by default. */
    readonly threshold?: number;
    /** If true, disables detecting and ignoring anti-aliased pixels. false by default. */
    readonly includeAA?: boolean;
    /* Blending factor of unchanged pixels in the diff output. Ranges from 0 for pure white to 1 for original brightness. 0.1 by default. */
    alpha?: number;
    /* The color of anti-aliased pixels in the diff output. [255, 255, 0] by default. */
    aaColor?: RGBTuple;
    /* The color of differing pixels in the diff output. [255, 0, 0] by default. */
    diffColor?: RGBTuple;
}

export function loadPngs(paths: string[], injectDelay: number = 0): Array<Promise<PNG>> {
    return paths.map((path, i) => delay(i * injectDelay).then(() => new Promise((resolve, reject) => {
        createReadStream(path).pipe(new PNG({}))
            .on('parsed', function (this: PNG) {
                resolve(this);
            }).on('error', reject);
    })));
}

export const matchImages =
    async (expected: Promise<PNG>, actual: Promise<PNG>,
        name: string, outputDir: string, options: PMOptions = { threshold: 0.1 }) => {
        const expectedImage = await expected;
        const actualImage = await actual;
        const { width, height } = expectedImage;
        const diff = new PNG({ width, height });
        const match = pixelmatch(expectedImage.data, actualImage.data, diff.data, width, height, options);
        if (match !== 0) {
            await new Promise((_, reject) => {
                const diffPath = join(outputDir, `diff-${name}`);
                diff.pack().pipe(
                    createWriteStream(diffPath))
                    .on('close', () => {
                        reject(new Error(`Images are not similar: ${name} does not look as expected
    See the diff at ${diffPath}`));
                    });
            });
        }
    };

export const matchImagesArray = async (expected: Array<Promise<PNG>>, actual: Array<Promise<PNG>>,
    names: string[], outputDir: string, options: PMOptions = { threshold: 0.1 }) => {
    expect(expected).to.have.length(actual.length, 'expected, actual and names must have same length');
    expect(expected).to.have.length(names.length, 'expected, actual and names must have same length');
    return Promise.all(expected.map((e, i) =>
        matchImages(e, actual[i], names[i], outputDir, options)
    ));
};