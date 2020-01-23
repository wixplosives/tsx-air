import fixtures from '../../fixtures';
import { expect } from 'chai';
import { htmlMatch } from './page.matcher';
import { preppeteer } from './puppeteer.mocha.utils';

describe('htmlMatch', () => {
    const api = preppeteer({
        fixtures,
        url: '/match.html'
    });
    describe('htmlMatch', () => {
        it('should fail if nothing was tested for', async () => {
            const page = await api.afterLoading;
            try {
                // @ts-ignore
                await htmlMatch(page, { name: 'NothingTested1' });
                expect.fail('NothingTested1 should have thrown');
            } catch (err) {
                expect(() => { throw err; }).to.throw('NothingTested1: nothing was checked');
            }
            try {
                await htmlMatch(page, { name: 'NothingTested2', cssQuery: '*' });
                expect.fail('NothingTested2 should have thrown');
            } catch (err) {
                expect(() => { throw err; }).to.throw('NothingTested2: nothing was checked');
            }
            try {
                await htmlMatch(page, { name: 'NothingTested3', cssQuery: '', children: [], descendants: [] });
                expect.fail('NothingTested3 should have thrown');
            } catch (err) {
                expect(() => { throw err; }).to.throw('NothingTested3: nothing was checked');
            }
        });

        it('should match by simple css query', async () => {
            const page = await api.afterLoading;
            await htmlMatch(page, { cssQuery: 'body', pageInstances: 1 });
            try {
                await htmlMatch(page, { name: 'Missing', cssQuery: 'missing', pageInstances: { above: 0 } });
                expect.fail('HTML should not match query');
            } catch (err) {
                expect(() => { throw err; }).to.throw(`Missing: page instances count: expected 0 to be above 0`);
            }
        });

        it('should match by text', async () => {
            const page = await api.afterLoading;
            await htmlMatch(page, {
                cssQuery: '.child.three',
                textContent: '[content of child three]'
            });
            await htmlMatch(page, {
                cssQuery: '.root',
                textContent: { contains: 'child three', doesNotContain: 'MISSING' }
            });
            await htmlMatch(page, {
                cssQuery: '.child:not(img)',
                textContent: { contains: '[' }
            });
            try {
                await htmlMatch(page, {
                    name: 'Text missing from some children',
                    cssQuery: '.child',
                    textContent: {
                        contains: 'three'
                    }
                });
                expect.fail('Not all .child contain that text');
            } catch (e) {
                expect(() => { throw e; }).to.throw(`Text missing from some children`);
            }
        });

        it('should match by simple children and defendants', async () => {      
            const page = await api.afterLoading;
            await Promise.all([
                htmlMatch(page, {
                    cssQuery: '.with.children', children: [3]
                }),
                htmlMatch(page, {
                    cssQuery: '.with.children', children: [
                        { cssQuery: '.one', pageInstances: 2 }]
                })]);
        });
    });
});