import { createTestServer, TestServer } from './testserver';
import { expect } from 'chai';
import { fail } from 'assert';
import { get } from './test.utils';

describe('test server: createServer', () => {
    let server: TestServer;
    afterEach(() => {
        server.close();
    });
    it('should have a baseUrl on localhost:port', async () => {
        server = await createTestServer();
        expect(server.baseUrl).to.match(/http:\/\/localhost\:\d{5}$/);
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
});