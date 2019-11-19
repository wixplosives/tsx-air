import { createMemoryFs } from '@file-services/memory';
import { Loader } from './examples.index';
import { Compiler } from './../compilers';
import { build, rebuild } from './build';
import { expect } from 'chai';

describe('build', () => {
    let filesLoaded: string[] = [];
    beforeEach(() => {
        filesLoaded = [];
    });

    const compiler: Compiler = {
        compile: async (source, _path) => {
            return source;
        },
        label: 'copier'
    };
    const mockFs = createMemoryFs({
        '/data.js': `
            export const b='b'`,
        '/data2.js': `
            export const newImport=true`,
        '/src': {
            'examples': {
                'ex1': {
                    'source.js': `
                    import {TSXAir} from '../../framework';
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

    const load: Loader = async path => {
        filesLoaded.push(path);
        return mockFs.readFileSync(path, 'utf8');
    };

    it('should evaluate a module with no imports', async () => {
        const res = await build(compiler, load, '/data');
        const mod = await res.module;
        expect(res.error).to.equal(undefined);
        expect(mod).to.deep.equal({
            b: 'b'
        });
        expect(filesLoaded).to.deep.equal(['/data.js']);
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
        expect(filesLoaded).to.deep.equal(['/src/main.js', '/src/a.js', '/data.js', '/src/inner/a.js']);
    });

    it('should evaluate a module that uses the framework', async () => {
        const res = await build(compiler, load, '/src/examples/ex1/source');
        expect(res.error).to.equal(undefined);
        expect((await res.module as any).air).to.be.instanceOf(Function);
        expect(filesLoaded).to.deep.equal(['/src/examples/ex1/source.js']);
        expect(filesLoaded).not.to.include('/src/framework.js');
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
            const original = await build(compiler, load, '/src/main.js');
            await original.module;
            filesLoaded = [];
            const modified = await rebuild(original, {
                '/src/main.js': 'export const changed=true;'
            });
            await modified.module;
            expect(filesLoaded).to.eql([]);
        });

        it('should load newly added dependencies', async () => {
            const original = await build(compiler, load, '/data.js');
            await original.module;
            expect(filesLoaded).to.eql(['/data.js']);
            filesLoaded = [];
            const modified = await rebuild(original, {
                '/data.js': `
                    import {b} from '/data2';
                    export const wasModified = b;`
            });
            await modified.module;
            expect(filesLoaded).to.eql(['/data2.js']);
        });
    });
});

