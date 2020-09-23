import { ExampleSuiteApi, Features, feature } from '@tsx-air/types';
import { htmlMatch, waitAnimationFrame } from '@tsx-air/testing';
import { expect } from 'chai';
import { Page } from 'puppeteer';

export const features: Features = [
    feature('hook')
];

export function suite(api: ExampleSuiteApi) {
    const getEyeBallsTranslation = async (page: Page) => {
        await waitAnimationFrame(page);
        const styles = await page.$$eval('.eye > div', eyeBalls => eyeBalls.map(e => e.getAttribute('style')));
        const eyes = styles.map(s => s!.match(/-?\d+/g)?.map(i => parseInt(i))) as number[][];
        if (!eyes || eyes.length === 0 || eyes[0].length === 0) {
            return {
                left: { x: 0, y: 0 },
                right: { x: 0, y: 0 }
            };
        }
        return {
            left: { x: eyes[0][0], y: eyes[0][1] },
            right: { x: eyes[1][0], y: eyes[1][1] }
        };
    };

    it.only('follows the mouse cursor', async () => {
        const page = await api.afterLoading;
        await htmlMatch(page, { cssQuery: '.eye', pageInstances: 2 });
        const face = JSON.parse(await page.$eval('.face', el => JSON.stringify((el as any).getBoundingClientRect())));
        await page.mouse.move(face.left, face.top);
        let eyes = await getEyeBallsTranslation(page);
        expect(eyes.right.x).to.be.approximately(-18, 2);
        expect(eyes.right.y).to.be.approximately(-6, 2);
        expect(eyes.left.x).to.be.approximately(-9, 2);
        expect(eyes.left.y).to.be.approximately(-10, 2);
        await page.mouse.move(face.right, face.bottom);
        eyes = await getEyeBallsTranslation(page);
        expect(eyes.right.x).to.be.approximately(4, 2);
        expect(eyes.right.y).to.be.approximately(18, 2);
        expect(eyes.left.x).to.be.approximately(8, 2);
        expect(eyes.left.y).to.be.approximately(10, 2);
    });
}