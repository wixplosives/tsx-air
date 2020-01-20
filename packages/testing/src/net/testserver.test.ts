import { createTestServer, TestServer } from './testserver';
import { expect } from 'chai';
import { get, threadedGet } from './http.client';
import fixtures from '../../fixtures';
import { block } from './block.thread';
import { join } from 'path';

describe('test server', () => {
    before(function () {
        this.timeout(3000);
    });

    let server: TestServer;
    afterEach(() => {
        server?.close();
    });

    describe('createServer', () => {
        it('should have a baseUrl on localhost:port', async () => {
            server = await createTestServer();
            expect(server.baseUrl).to.match(/http:\/\/localhost\:\d{5}$/);
        });

        it('should find free ports for multiple servers', async () => {
            server = await createTestServer(12222);
            const server2 = await createTestServer(12222);
            expect(server.baseUrl).not.to.eql(server2.baseUrl);
            server2.close();
        });
    });

    describe('addStaticRoot', () => {
        it('should serve files from added the roots', async () => {
            server = await createTestServer();
            await server.addStaticRoot(fixtures);
            await server.addStaticRoot(join(fixtures, 'inner'));
            expect(await Promise.all([
                get(await server.baseUrl + '/static.root.priority'),
                get(await server.baseUrl + '/inner/common.file'),
                get(await server.baseUrl + '/common.file'),
                get(await server.baseUrl + '/first.static.root'),
            ])).to.eql([
                'added latest', 'ok', 'ok', 'no conflict, no problem'
            ]);
        });
        it('should respond with 404 error for missing files', async () => {
            server = await createTestServer();
            await server.addStaticRoot(fixtures);
            await shouldFail(server.baseUrl + '/no.such.file', 'Server served missing file');
        });
    });

    describe(`addEndpoint`, () => {
        it('should serve GET endpoint set by addEndpoint', async () => {
            server = await createTestServer();
            await server.addEndpoint('/endpoint', 'added');
            expect(await get(await server.baseUrl + '/endpoint')).to.eql('added');
        });

        it('should prioritize endpoints set by addEndpoint over addStaticRoot', async () => {
            server = await createTestServer();
            await server.addStaticRoot(fixtures);
            await server.addEndpoint('/from.fs', 'nope');
            expect(await get(await server.baseUrl + '/from.fs')).to.eql('nope');
        });
    });

    describe('reset', () => {
        it('should clear all endpoints', async () => {
            server = await createTestServer();
            await server.addEndpoint('/endpoint', 'added');
            expect(await get(await server.baseUrl + '/endpoint')).to.eql('added');
            await server.reset();
            await shouldFail(server.baseUrl + '/endpoint', 'Endpoint active after server reset');
        });

        it('should clear the base path', async () => {
            server = await createTestServer();
            await server.addStaticRoot(fixtures);
            expect(await get(await server.baseUrl + '/from.fs')).to.eql('ok');
            await server.reset();
            await shouldFail(server.baseUrl + '/from.fs', 'Endpoint active after server reset');
        });
    });

    it('should handle multiple calls', async () => {
        server = await createTestServer();
        try {
            await Promise.all([
                server.addEndpoint('/1', '1'),
                server.addEndpoint('/2', '2'),
                server.addEndpoint('/3', '3'),
                server.addEndpoint('/4', '4')
            ]);
        } catch (e) {
            expect.fail('server error');
        }
        expect(
            await Promise.all([
                get(server.baseUrl + '/1'),
                get(server.baseUrl + '/2'),
                get(server.baseUrl + '/3'),
                get(server.baseUrl + '/4'),
            ])).to.eql(['1', '2', '3', '4']);
    });

    it('should respond when the main thread is busy (ie debugger breakpoint)', async () => {
        server = await createTestServer();
        await server.addEndpoint('/got', 'ok');
        const done = threadedGet(server.baseUrl + '/got');
        const [start, end] = block(200);
        const { result, time } = await done;

        expect(result).to.eql('ok');
        expect(time, 'server responded BEFORE or AFTER main thread was blocked').to.be.within(start, end);
    });
});

async function shouldFail(url: string, message: string) {
    let error = 'no error';
    try {
        await get(url);
    } catch (err) {
        error = err;
    } finally {
        expect(error, message).to.equal(404);
    }
}