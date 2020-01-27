import { duration, delay } from './promises';
import { expect } from 'chai';
describe('promises', () => {
    describe('delay', () => {
        it('should resolve after the set timeout', async () => {
            expect(await duration(delay(21))).to.be.within(20, 50);
        });
        it('should throw when canceled', async () => {
            const dl = delay(100);
            try {
                dl.cancel();
                await dl;
            } catch (e) {
                expect(e.message).to.equal('Cancelled');
            }
        });
        it('should fire when finish is called', async () => {
            const dl = delay(100);
            const actualDuration = duration(dl);
            dl.finish();
            expect(await actualDuration).to.be.lessThan(100);
        });
        it('should reset the timer with setTimeout', async () => {
            const dl = delay(100);
            const actualDuration = duration(dl);
            dl.setTimeout(11);
            expect(await actualDuration).to.be.within(10, 50);
        });
    });
});