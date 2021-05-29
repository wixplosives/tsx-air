import fixtures from '../../fixtures';
import { createMockpiler } from '@tsx-air/testing';
import { expect } from 'chai';
import { build } from './build';
import { reCompile, rebuild } from './rebuild';
import { jsLoaderFromPath } from './test.utils';


const compiler = createMockpiler('compiled');
const recompiler = createMockpiler('wasReCompiled');

const loader = jsLoaderFromPath(fixtures, false);

describe('rebuild', () => {
    beforeEach(() => {
        loader.loaded = [];
    });
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
    beforeEach(() => {
        loader.loaded = [];
    });
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