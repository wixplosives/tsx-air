import { duration, delay } from './promises';
import { expect } from 'chai';
describe('promises', () => {
    describe('delay', () => {
        const m = process.env.CI ? 3 : 1;
        it('should resolve after the set timeout', async () => {
            expect(await duration(delay(21 * m))).to.be.within(20 * m, 50 * m);
        });
        it('should throw when canceled', async () => {
            const dl = delay(100 * m);
            try {
                dl.cancel();
                await dl;
            } catch (e) {
                expect(e.message).to.equal('Cancelled');
            }
        });
        it('should fire when finish is called', async () => {
            const dl = delay(100 * m);
            const actualDuration = duration(dl);
            dl.finish();
            expect(await actualDuration).to.be.lessThan(100 * m);
        });
        it('should reset the timer with setTimeout', async () => {
            const dl = delay(100 * m);
            const actualDuration = duration(dl);
            dl.setTimeout(11 * m);
            expect(await actualDuration).to.be.within(10 * m, 50 * m);
        });
    });
});