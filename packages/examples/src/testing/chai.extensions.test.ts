import { launch, Browser, Page } from 'puppeteer';
import { expect } from 'chai';
import './chai.extensions';

describe('chai extensions', () => {
    describe('puppeteer matchers', () => {
        let browser: Browser;
        let page: Page;
        before(async () => {
            browser = await launch();
            page = (await browser.pages())[0];
        });
        afterEach(async () => {
            page.close().catch(() => void (0));
            page = await browser.newPage();
        });
        after(() => {
            browser.close().catch(() => void (0));
        });

        describe('text', () => {
            it('should match a puppeteer context inner text', async () => {
                const body = await page.$('body');
                await body?.evaluate(b => b.innerHTML = `<div>
                    Parent <p>
                        child</p> <br> 
                <div>`);

                await expect(body).to.have.text(`Parent 
                child`);
                await expect(body).not.to.have.text('!!!');
            });
        });
        describe('one', () => {
            it('should assert a single cssQuery match within decedents', async () => {
                const body = await page.$('body');
                await body?.evaluate(b => b.innerHTML = `<div>
                    Parent <div>
                    child</div> <br> 
                <div>`);

                await expect(page).to.have.one('br');
                await expect(page).not.to.have.one('div');
                await expect(page).not.to.have.one('p');
            });
        });
    });
});