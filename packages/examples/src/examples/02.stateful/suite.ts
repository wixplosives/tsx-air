import { ExampleSuiteApi, feature, Features } from '@tsx-air/types';
import { htmlMatch } from '@tsx-air/testing';

export const features:Features = [
    feature('stateful','component'),
    feature('single','store'),
    feature('event','handler')
];

export function suite (api: ExampleSuiteApi) {
    it('should have 2 buttons', async () => {
        const page = await api.afterLoading;
        await htmlMatch(page, {
            cssQuery: '.btn',
            pageInstances: 2,
            textContent: {
                contains: 'button'
            }
        });
    });
    
    describe('interactions', () => {
        it('should respond to buttons being clicked', async () => {
            const page = await api.afterLoading;
            const buttons = await page.$$('.btn');
            await buttons[0].click();
            await buttons[0].click();
            await buttons[0].click();
            await buttons[1].click();
            await page.waitFor(50);
            await htmlMatch(buttons[0], {
                textContent: 'button!!!'
            });
            await htmlMatch(buttons[1], {
                textContent: 'button*'
            });
            await htmlMatch(page, {
                cssQuery: '.changeCount',
                textContent: 'state changed 8 times'
            });
            // await htmlMatch(page, {
            //     cssQuery: '.volatile',
            //     textContent: 'volatile variable is still at 1'
            // });
        });
    });
}