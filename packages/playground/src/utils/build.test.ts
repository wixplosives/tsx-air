import { IFileSystem } from '@file-services/types';
import { createMemoryFs } from '@file-services/memory';
import { Loader } from './examples.index';
import { Compiler } from './../compilers';
import { build, rebuild, reCompile } from './build';
import { expect } from 'chai';
import { asJs } from './build.helpers';
// tslint:disable: no-unused-expression

describe('build', () => {
    let filesLoaded: string[] = [];
    let mockFs:IFileSystem;
    beforeEach(() => {
        filesLoaded = [];
        mockFs = createMemoryFs({
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

    const compiler: Compiler = {
        compile: async (source, _path) => {
            return source;
        },
        label: 'copier'
    };

    const load: Loader = async path => {
        filesLoaded.push(path);
        return mockFs.readFileSync(asJs(path), 'utf8');
    };

    it('should evaluate a module with no imports', async () => {
        const res = await build(compiler, load, '/data');
        const mod = await res.module;
        expect(res.error).to.equal(undefined);
        expect(mod).to.deep.equal({
            b: 'b'
        });
        expect(filesLoaded).to.deep.equal(['/data']);
    });

    it('should evaluate a module with imports', async () => {
        const res = await build(compiler, load, '/src/main');
        expect(res.error).to.equal(undefined);
        expect(await res.module).to.deep.equal({
            c: {
                a: 'ab',
                b: 'b'
            }
        });
        expect(filesLoaded).to.deep.equal(['/src/main', '/src/a', '/data', '/src/inner/a']);
    });

    it('should evaluate a module that uses the framework', async () => {
        const res = await build(compiler, load, '/src/examples/ex1/source');
        expect(res.error).to.equal(undefined);
        expect((await res.module as any).air).to.be.instanceOf(Function);
        expect(filesLoaded).to.eql(['/src/examples/ex1/source']);
        expect(filesLoaded).not.to.include('/@tsx-air/framework');
    });

    describe('rebuild', () => {
        it('should return a modified build for the root file', async () => {
            const original = await build(compiler, load, '/src/main');
            await original.module;
            const modified = await rebuild(original, {
                '/src/main.js': 'export const changed=true;'
            });
            expect(await modified.module).to.eql({ changed: true });
        });

        it('should return a modified build for changed dependencies', async () => {
            const original = await build(compiler, load, '/src/main');
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
            const original = await build(compiler, load, '/src/main');
            await original.module;
            filesLoaded = [];
            const modified = await rebuild(original, {
                '/src/main.js': 'export const changed=true;'
            });
            await modified.module;
            expect(filesLoaded).to.eql([]);
        });

        it('should load newly added dependencies', async () => {
            const original = await build(compiler, load, '/data');
            await original.module;
            expect(filesLoaded).to.eql(['/data']);
            filesLoaded = [];
            const modified = await rebuild(original, {
                '/data.js': `
                    import {b} from '/data2';
                    export const wasModified = b;`
            });
            await modified.module;
            expect(filesLoaded).to.eql(['/data2']);
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
            const original = await build(compiler, load, '/src/main');
            await original.module;
            filesLoaded = [];
            const recompiled = await reCompile(original, newCompiler);
            const module = await recompiled.module;
            expect(module.wasRecompiled).to.be.true;
        });

        it('should not reload any sources', async () => {
            const original = await build(compiler, load, '/src/main');
            await original.module;
            filesLoaded = [];
            const recompiled = await reCompile(original, newCompiler);
            await recompiled.module;
            expect(filesLoaded).to.eql([]);
        });

        it('should recompile all the imports', async () => {
            const original = await build(compiler, load, '/src/main');
            await original.module;
            filesLoaded = [];
            const recompiled = await reCompile(original, newCompiler);
            await recompiled.module;
            await Promise.all(
                recompiled.imports.map(async i => {
                    expect((await (await i).module).wasRecompiled).to.be.true;
                }));
        });
    });
});

