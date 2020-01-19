import { Page } from 'puppeteer';
import { htmlMatch } from '@tsx-air/testing';

export default function (getPage: (testTsx: string) => Promise<Page>) {
    return describe('02.stateful', () => {
        it('should have 2 buttons', async () => {
            const page = await getPage('./suite.boilerplate.ts');
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
                const page = await getPage('./suite.boilerplate.ts');
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
                    textContent:'button*'
                });
            }); 
        });
    });
}