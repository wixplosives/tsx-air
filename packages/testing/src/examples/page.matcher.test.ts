import { createTestServer, TestServer } from '../net';
import { htmlMatch } from '..';
import { launch, Page, Browser } from 'puppeteer';
import { expect } from 'chai';
import base from '../../fixtures';

describe('htmlMatch', () => {
    let server: TestServer;
    let browser: Promise<Browser>;
    let page: Page;
    before(async () => {
        browser = launch({ timeout: 2000 });
        server = await createTestServer();
        await server.setRoot(base);
    });
    beforeEach(async () => {
        page = await (await (await browser).newPage());
        await page.goto(server.baseUrl + '/match.html');
    });
    afterEach(async () => {
        try {
            (await (await browser).pages()).forEach(i => i.close().catch(() => void (0)));
        } catch { /* ignore */ }
    });
    after(() => {
        server.close();
        browser.then(i => {
            console.log('Closing browser');
            i.close();
        });
    });

    describe('htmlMatch', () => {
        it('should match by simple css query', async () => {
            const matches = await htmlMatch(page, { cssQuery: 'body' });
            expect(matches).to.have.length.above(0);
            try {
                await htmlMatch(page, { name: 'Missing', cssQuery: 'missing' });
                expect.fail('HTML should not match query');
            } catch (err) {
                expect(() => { throw err; }).to.throw(/"Missing" scope instances count: expected 0 to be above 0/);
            }
        });
        it('should match by text', async () => {
            const matches = await htmlMatch(page, {
                cssQuery: '.child.one',
                textContent: '[content from child one]'
            });
            expect(matches).to.have.length.above(0);

        });
        it('should match by simple children and defendants', async () => {
            await Promise.all([
                htmlMatch(page, {
                    cssQuery: '.with.children', children: [3]
                }),
                await htmlMatch(page, {
                    cssQuery: '.with.children', children: [
                        { cssQuery: '.one', pageInstances: 2 }]
                })]);
        });
    });
});