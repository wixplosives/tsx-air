import { expect } from 'chai';
import { createTestServer, TestServer } from './testserver';
import { threadedGet, get } from './http.client';

describe('http.client', () => {
    let server:TestServer;
    before(async ()=> {
        server = await createTestServer();
        await server.addEndpoint('/got', 'ok');
    });
    after(() => {
        server.close();
    });
    describe('threadedGet', () => {
        it('should GET a value from server endpoint', async () => {
            const { result } = await threadedGet(server.baseUrl + '/got');
            expect(result).to.eql('ok');
        });
    });
    describe('get', () => {
        it('should GET a value from server endpoint', async () => {
            const result = await get(server.baseUrl + '/got');
            expect(result).to.eql('ok');
        });
    });
});