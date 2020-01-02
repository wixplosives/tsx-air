import { manualCompiler } from './../compilers';
import { expect } from 'chai';
import { Worker } from 'worker_threads';
import { getExamples, buildExample } from './examples.index';
import { join } from 'path';
import fetch from 'node-fetch';

describe('examples index API', () => {
    let server: Worker;
    let loaded: string[] = [];
    before(done => {
        let port = 13123;
        server = new Worker(join(__dirname, 'example.indexer.express.js'), {
            workerData: { port }
        });
        server.on('message', m => {
            port = m;
            done();
        });
        (globalThis as any).fetch = (url: string) => {
            loaded.push(url);
            return fetch(`http://localhost:${port}${url}`);
        };
    });
    beforeEach(() => {
        loaded = [];
    });
    after(() => {
        server.terminate();
    });

    describe('getExamples', () => {
        it('should fetch the list of examples', async () => {
            expect(await getExamples()).to.include.all.members([
                '01.stateless-parent-child',
                '02.stateful', '03.thumb', '04.zoom', '05.static-gallery'
            ]);
            expect(loaded).to.have.length(1);
        });
    });

    describe('buildExample', () => {
        it('should load example files', async () => {
            const example = await buildExample('01.stateless-parent-child', manualCompiler);
            await (await example.build).module;
            expect(loaded).to.include.all.members([
                '/examples/01.stateless-parent-child/runner',
                '/examples/01.stateless-parent-child/index.source',
                '/examples/01.stateless-parent-child/index.compiled'
            ]);
        });
        it('should build the example module', async () => {
            const example = await buildExample('01.stateless-parent-child', manualCompiler);
            const  module  = await await (await example.build).module;
            expect(await (await example.build).error).to.be.undefined;
            expect(module.runExample).to.be.a('function');
        });
    });
});