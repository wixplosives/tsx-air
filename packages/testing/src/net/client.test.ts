import { expect } from 'chai';
import { createTestServer } from './testserver';
import {  threadedGet } from './client';

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
});