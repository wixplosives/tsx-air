import { manualCompiler } from './../compilers';
import { expect } from 'chai';
import { Worker } from 'worker_threads';
import { getExamples, buildExample } from './examples.index';
import { join } from 'path';
import { get } from '@tsx-air/testing';

describe('examples index API', () => {
    const minimalExamplesSet = [
        '01.stateless-parent-child',
        '02.stateful',
        '03.thumb',
        '04.zoom'
    ];
    const minimalExampleSources = [
        '/runner', '/index.source', '/index.compiled'
    ];
    let server: Worker;
    let loaded: string[] = [];
    const loading: Set<Promise<any>> = new Set();
    const slowUrls: Array<{ url: string, duration: number }> = [];
    const tooooSlow = 300;
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
            const start = Date.now();
            const req = get(`http://localhost:${port}${url}`);
            req.then(() => {
                loaded.push(url);
                loading.delete(req);
                const duration = Date.now() - start;

                if (duration > tooooSlow) {
                    slowUrls.push({ url, duration });
                }
            });
            return req.then(r => ({
                    text: async () => r,
                    json: async () => JSON.parse(r)
            }));
        };
    });
    beforeEach(() => {
        loaded = [];
    });
    after(() => {
        server.terminate();
    });
    afterEach(function () {
        if (loading.size) {
            this.currentTest?.emit('error', 'Some resources are still loading');
        }
        if (slowUrls.length) {
            this.currentTest?.emit('error', 'Got slow calls:\n'
                + slowUrls.map(s => s.duration + 'ms: ' +s.url)
            );
        }
        expect(loading.size, 'Some resources are still loading').to.equal(0);
        expect(slowUrls).to.eql([]);
    });

    describe('getExamples', () => {
        it('should fetch the list of examples', async () => {
            expect(await getExamples()).to.include.all.members(minimalExamplesSet);
            expect(loaded).to.have.length(1);
        });
    });

    describe('buildExample', () => {
        it('should load example files', async () => {
            const example = await buildExample('01.stateless-parent-child', manualCompiler);
            await (await example.build).module;
            expect((await example.build).error).to.equal(undefined, 'Errors while building example');
            expect(loaded).to.include.all.members([
                '/examples/01.stateless-parent-child/runner',
                '/examples/01.stateless-parent-child/style.css',
                '/examples/01.stateless-parent-child/readme.md',
                '/examples/01.stateless-parent-child/index.source',
                '/examples/01.stateless-parent-child/index.compiled',
            ]);
        });

        describe('examples', () => {
            minimalExamplesSet.forEach(exampleName => {
                it(`should be able to build "${exampleName}"`, async () => {
                    const example = await buildExample(exampleName, manualCompiler);
                    const module = await await (await example.build).module;
                    expect(await (await example.build).error, `Error building ${exampleName}`).to.equal(undefined);
                    expect(module.runExample, `${exampleName}/runner#runExample is not a function`).to.be.a('function');
                    expect(module.Component).to.haveOwnProperty('factory');
                    expect(loaded, 'Some minimal example resources were not loaded')
                        .to.include.all.members(minimalExampleSources
                            .map(r => `/examples/${exampleName}${r}`));
                });
            });
        });
    });
});