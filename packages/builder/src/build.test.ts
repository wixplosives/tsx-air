import { build, rebuild, reCompile } from './build';
import { expect } from 'chai';
import { build as fixtures } from '../fixtures';
import { DebuggableLoader, jsLoaderFromPath, createMockpiler } from '@tsx-air/testing';
// tslint:disable: no-unused-expression

const compiler = createMockpiler('compiled');
const recompiler = createMockpiler('wasReCompiled');

describe('build', () => {
    let loader: DebuggableLoader;
    beforeEach(() => {
        loader = jsLoaderFromPath(fixtures, false);
    });

    it('should evaluate a module with no imports', async () => {
        const res = await build(compiler, loader, '/no.imports');
        const mod = await res.module;
        expect(res.error).to.equal(undefined);
        expect(loader.loaded).to.deep.equal(['/no.imports']);
        expect(mod).to.deep.equal({
            wasBuilt: true,
            compiled:true
        });
    });

    it('should evaluate a module with imports', async () => {
        const res = await build(compiler, loader, '/with.imports');
        expect(res.error).to.equal(undefined);
        expect(await res.module).to.deep.equal({
            compiled: true,
            localImports: 'work',
            deep: true,
            framework: 'is a function'
        });

        expect(loader.loaded, 'Framework should have been preloaded').not.to.include('/@tsx-air/framework');
        expect(loader.loaded).to.have.all.members(['/with.imports', '/imported', '/deep.import']);
    });

    describe('rebuild', () => {
        it('should return a modified build for the root file', async () => {
            const original = await build(compiler, loader, '/with.imports');
            await original.module;
            const modified = await rebuild(original, {
                '/with.imports': 'export const changed=true;'
            });
            expect(await modified.module).to.eql({ 
                compiled: true,
                changed: true
            });
        });

        it('should return a modified build for changed dependencies', async () => {
            const original = await build(compiler, loader, '/with.imports');
            await original.module;
            const modified = await rebuild(original, {
                '/imported': `export const modified=true`
            });
            expect(await modified.module).to.eql({
                compiled: true,
                modified: true,
                framework: 'is a function'
            });
        });

        it('should load ONLY newly imported files', async () => {
            const original = await build(compiler, loader, '/with.imports');
            await original.module;
            // we only care about rebuild
            loader.loaded = [];
            const modified = await rebuild(original, {
                '/with.imports': `
                    export * from './deep.import';
                    export * from './new.import';`});
            await modified.module;
            expect(loader.loaded).to.eql(['/new.import']);
        });
    });

    describe('reCompile', () => {
        it('should recompile the source', async () => {
            const original = await build(compiler, loader, '/with.imports');
            await original.module;
            loader.loaded = [];
            const recompiled = await reCompile(original, recompiler);
            const module = await recompiled.module;
            expect(module).to.eql({
                wasReCompiled: true,
                localImports: 'work',
                deep: true,
                framework: 'is a function'
            });
            expect(loader.loaded, 'Sources should not have re-loaded').to.eql([]);
        });


        it('should recompile all source imports', async () => {
            const original = await build(compiler, loader, '/with.imports');
            await original.module;
            loader.loaded = [];
            const recompiled = await reCompile(original, recompiler);
            await recompiled.module;
            for (const imported of recompiled.imports) {
               if ((await imported).path.indexOf('node_modules') === -1) {
                   expect((await (await imported).module).wasReCompiled).to.be.true;
               } else {
                   expect((await (await imported).module).wasReCompiled).to.be.undefined;
               }
            }
    });
});

