import { expect } from 'chai';
import { createTestServer } from './server/testserver';
import { block, threadedGet } from './utils';

describe('test.utils', () => {
    describe('threadedGet', () => {
        it('should GET a value from server endpoint', async () => {
            const server = await createTestServer();
            await server.addEndpoint('/got', 'ok');
            const { result } = await threadedGet(server.baseUrl + '/got');
            expect(result).to.eql('ok');
            server.close();
        });
    });
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

});