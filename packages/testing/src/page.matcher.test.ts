import { createTestServer, TestServer } from './server/testserver';
import { htmlMatch } from '.';
import { launch, Page, Browser } from 'puppeteer';
import { expect } from 'chai';
import { base } from '../fixtures';

describe('htmlMatch', () => {
    let server: TestServer;
    let browser: Promise<Browser>;
    let page: Page;
    before(async () => {
        browser = launch();
        server = await createTestServer();
        await server.setRoot(base);
    });
    beforeEach(async () => page = await (await browser).newPage());
    afterEach(async () => {
        try {
            (await (await browser).pages()).forEach(i => i.close().catch(() => void (0)));
        } catch { /* ignore */ }
    });
    after(async () => {
        server.close();
        (await browser).close();
    });

    describe('htmlMatch', () => {
        it('should match by simple css query', async () => {
            // tslint:disable-next-line: no-unused-expression
            expect(await htmlMatch(page, { cssQuery: 'body' })).to.equal(true);
        });
    });
});