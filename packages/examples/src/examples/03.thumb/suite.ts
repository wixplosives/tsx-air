import { htmlMatch } from '@tsx-air/testing';

export default function () {
    it('should start with a preloader', async function () {
        const { page } = this;
        await htmlMatch(page, {
            cssQuery: '.thumb',
            pageInstances: 1,
            children: [{
                cssQuery: '.preloader',
                scopeInstances: 1
            }]
        });
    });
    it('should change to image once loaded', async function () {
        const { page, server } = this;
        server.addEndpoint('/images/prettyboy.jpg', '');
        await page.evaluate(() => {
            (window as any).app.updateProps({ url: '/images/prettyboy.jpg' });
        });
        await page.waitFor(100);
        await htmlMatch(page, {
            cssQuery: '.thumb',
            pageInstances: 1,
            children: [{
                cssQuery: 'img',
                scopeInstances: 1
            },
            {
                cssQuery: '.preloader',
                scopeInstances: 0
            }]
        });
    });
}