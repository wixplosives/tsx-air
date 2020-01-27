import { expect } from 'chai';
import { block } from './block.thread';

describe('block', () => {
    it('should block the main thread for the given duration', async () => {
        const resolveASAP = new Promise(resolve => {
            process.nextTick(() => {
                resolve(Date.now());
            });
        });
        const [, end] = block(50);
        const resolveTime = await resolveASAP;
        expect(resolveTime).not.to.be.lessThan(end);
    });
});