import { ExampleSuiteApi, feature, Features } from '@tsx-air/types';
import { htmlMatch, waitAnimationFrame } from '@tsx-air/testing';

export const features: Features = [
    feature('stateful', 'component'),
    feature('single', 'store'),
    feature('event', 'handler')
];

export function suite(api: ExampleSuiteApi) {
    it('should have 2 buttons', async () => {
        const page = await api.afterLoading;
        await htmlMatch(page, {
            cssQuery: '.btn',
            pageInstances: 2,
            textContent: {
                contains: 'Button'
            }
        });
    });

    describe('interactions', () => {
        it('should respond to buttons being clicked', async () => {
            const page = await api.afterLoading;
            const [buttonA, buttonB] = await page.$$('.btn');
            const clickA = 4;
            const clickB = 4;
            for (let i = 0; i < clickA; i++) {
                await buttonA.click();
            }
            for (let i = 0; i < clickB; i++) {
                await buttonB.click();
            }
            await waitAnimationFrame(page);
            await htmlMatch(buttonA, {
                textContent: `Button A (${clickA})`
            });
            await htmlMatch(buttonB, {
                textContent: `Button B (${clickB})`
            });
            await htmlMatch(page, {
                cssQuery: '.changeCount',
                textContent: `View rendered ${clickA + clickB + 1} times`
            });
            await htmlMatch(page, {
                cssQuery: '.volatile',
                textContent: 'volatile variable is still at 1'
            });
        });
    });
}