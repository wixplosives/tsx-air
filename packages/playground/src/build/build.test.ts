import { build } from './build';
import { expect } from 'chai';
import fixtures from '../../fixtures';
import { createMockpiler } from '@tsx-air/testing';
import { DebuggableLoader, jsLoaderFromPath } from './test.utils';

const compiler = createMockpiler('compiled');

describe('build', () => {
    let loader: DebuggableLoader;
    beforeEach(async () => {
        loader = jsLoaderFromPath(fixtures, false);
    });

    it('should evaluate a module with no imports', async () => {
        const res = await build(compiler, loader, '/no.imports');
        const mod = await res.module;
        expect(res.error).to.equal(undefined);
        expect(loader.loaded).to.deep.equal(['/no.imports']);
        expect(mod).to.deep.equal({
            wasBuilt: true,
            compiled: true
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
});
