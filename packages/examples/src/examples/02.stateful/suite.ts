import { ExampleSuiteApi, feature, Features } from '@tsx-air/types';
import { htmlMatch } from '@tsx-air/testing';
import repeat from 'lodash/repeat';

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
            const pressA = 4;
            const pressB = 4;
            for (let i = 0; i < pressA; i++) {
                await buttonA.click();
            }
            for (let i = 0; i < pressB; i++) {
                await buttonB.click();
            }
            await page.waitFor(50);
            await htmlMatch(buttonA, {
                textContent: 'ButtonA' + repeat('!', pressA)
            });
            await htmlMatch(buttonB, {
                textContent: 'ButtonB' + repeat('*', pressB)
            });
            await htmlMatch(page, {
                cssQuery: '.changeCount',
                textContent: `state changed ${pressA + pressB + 1} times`
            });
            await htmlMatch(page, {
                cssQuery: '.volatile',
                textContent: 'volatile variable is still at 1'
            });
        });
    });
}