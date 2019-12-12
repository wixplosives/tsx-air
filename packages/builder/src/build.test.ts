import { build, rebuild, reCompile } from './build';
import { expect } from 'chai';
import { Compiler } from './types';
import { trivialCompiler as compiler, DebugableLoader, jsLoaderFrom, trimCode } from './test.utils';
// tslint:disable: no-unused-expression

describe('build', () => {
    let loader: DebugableLoader;
    beforeEach(() => {
        loader = jsLoaderFrom({
            '/data.js': `
            export const b='b'`,
            '/data2.js': `
            export const newImport=true`,
            '/src': {
                'examples': {
                    'ex1': {
                        'source.js': `
                        import {TSXAir} from '@tsx-air/framework';
                        export const air = TSXAir;`
                    }
                },
                'main.js': `
                import {a} from './a';
                import {b} from '../data'
                export const c = {a,b};`,
                'a.js': `
                import {val} from './inner/a';
                export const a=val`,
                'inner': {
                    'a.js': `
                import {b} from '../../data';
                export const val = 'a'+b;`
                }
            }
        });
    });

    it('should evaluate a module with no imports', async () => {
        const res = await build(compiler, loader, '/data');
        const mod = await res.module;
        expect(res.error).to.equal(undefined);
        expect(loader.loaded).to.deep.equal(['/data']);
        expect(mod).to.deep.equal({
            b: 'b'
        });
    });

    it('should evaluate a module with imports', async () => {
        const res = await build(compiler, loader, '/src/main');
        expect(res.error).to.equal(undefined);
        expect(await res.module).to.deep.equal({
            c: {
                a: 'ab',
                b: 'b'
            }
        });
        expect(loader.loaded).to.deep.equal(['/src/main', '/src/a', '/data', '/src/inner/a']);
    });

    it('should evaluate a module that uses the framework', async () => {
        const res = await build(compiler, loader, '/src/examples/ex1/source');
        expect(res.error).to.equal(undefined);
        expect((await res.module as any).air).to.be.instanceOf(Function);
        expect(loader.loaded).to.eql(['/src/examples/ex1/source']);
        expect(loader.loaded).not.to.include('/@tsx-air/framework');
    });

    describe('rebuild', () => {
        it('should return a modified build for the root file', async () => {
            const original = await build(compiler, loader, '/src/main');
            await original.module;
            const modified = await rebuild(original, {
                '/src/main.js': 'export const changed=true;'
            });
            expect(await modified.module).to.eql({ changed: true });
        });

        it('should return a modified build for changed dependencies', async () => {
            const original = await build(compiler, loader, '/src/main');
            await original.module;
            const modified = await rebuild(original, {
                '/src/a.js': `export const a='modified'`
            });
            expect(await modified.module).to.eql({
                c: {
                    a: 'modified',
                    b: (await original.module as any).c.b
                }
            });
        });

        it('should not load new files in no new imports were added', async () => {
            const original = await build(compiler, loader, '/src/main');
            await original.module;
            loader.loaded = [];
            const modified = await rebuild(original, {
                '/src/main.js': 'export const changed=true;'
            });
            await modified.module;
            expect(loader.loaded).to.eql([]);
        });

        it('should load newly added dependencies', async () => {
            const original = await build(compiler, loader, '/data');
            await original.module;
            expect(loader.loaded).to.eql(['/data']);
            loader.loaded = [];
            const modified = await rebuild(original, {
                '/data.js': trimCode(`
                    import {b} from '/data2';
                    export const wasModified = b;`)
            });
            await modified.module;
            expect(loader.loaded).to.eql(['/data2']);
        });
    });

    describe('reCompile', () => {
        const newCompiler: Compiler = {
            compile: async (source, _path) => {
                return source + `
                export const wasRecompiled=true;`;
            },
            label: 'reCompiler'
        };

        it('should recompile the source', async () => {
            const original = await build(compiler, loader, '/src/main');
            await original.module;
            loader.loaded = [];
            const recompiled = await reCompile(original, newCompiler);
            const module = await recompiled.module;
            expect(module.wasRecompiled).to.be.true;
        });

        it('should not reload any sources', async () => {
            const original = await build(compiler, loader, '/src/main');
            await original.module;
            loader.loaded = [];
            const recompiled = await reCompile(original, newCompiler);
            await recompiled.module;
            expect(loader.loaded).to.eql([]);
        });

        it('should recompile all the imports', async () => {
            const original = await build(compiler, loader, '/src/main');
            await original.module;
            loader.loaded = [];
            const recompiled = await reCompile(original, newCompiler);
            await recompiled.module;
            await Promise.all(
                recompiled.imports.map(async i => {
                    expect((await (await i).module).wasRecompiled).to.be.true;
                }));
        });
    });
});

