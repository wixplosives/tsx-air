import { createTestServer, TestServer } from './testserver';
import { expect } from 'chai';
import { fail } from 'assert';
import { get, threadedGet, block } from './test.utils';

describe('test server: createServer', () => {
    let server: TestServer;
    afterEach(() => {
        server?.close();

    });
    it('should have a baseUrl on localhost:port', async () => {
        server = await createTestServer();
        expect(server.baseUrl).to.match(/http:\/\/localhost\:\d{5}$/);
    });
    it('should find free ports for multiple servers', async () => {
        server = await createTestServer();
        const server2 = await createTestServer();
        expect(server.baseUrl).not.to.eql(server2.baseUrl);
        server2.close();
    });
    it('should serve GET endpoint set by addEndpoint', async () => {
        server = await createTestServer();
        await server.addEndpoint('/endpoint', 'added');
        expect(await get(await server.baseUrl + '/endpoint')).to.eql('added');
        expect(await get(await server.baseUrl + '/endpoint')).to.eql('added');
    });
    it('should clear all endpoints after "reset"', async () => {
        server = await createTestServer();
        await server.addEndpoint('/endpoint', 'added');
        expect(await get(await server.baseUrl + '/endpoint')).to.eql('added');
        await server.reset();
        try {
            await get(await server.baseUrl + '/endpoint');
            fail('expected 404');
        } catch (err) {
            expect(err).to.equal(404);
        }
    });

    it('should handle multiple calls', async () => {
        server = await createTestServer();
        try {
            await Promise.all([
                server.addEndpoint('/1', ''),
                server.addEndpoint('/2', ''),
                server.addEndpoint('/3', ''),
                server.addEndpoint('/4', '')
            ]);
        } catch (e) {
            fail('server error');
        }
    });

    describe('test helpers', () => {
        describe('threadedGet', () => {
            it('should GET a value from server endpoint', async () => {
                server = await createTestServer();
                await server.addEndpoint('/got', 'ok');
                const { result } = await threadedGet(server.baseUrl + '/got');
                expect(result).to.eql('ok');
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

    it('should respond when the main thread is busy (ie debugger breakpoint)', async () => {
        server = await createTestServer();
        await server.addEndpoint('/got', 'ok');
        const done = threadedGet(server.baseUrl + '/got');
        const [start, end] = block(100);
        const { result, time } = await done;

        expect(result).to.eql('ok');
        expect(time, 'server responded BEFORE main thread was blocked').to.be.greaterThan(start);
        expect(time, 'server responded AFTER main thread was released').to.be.lessThan(end);
    });
});