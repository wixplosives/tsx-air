import { analyze, TsxFile, Import } from '@wixc3/tsx-air-compiler/src';
import { Compiler } from '../compilers';
import { Loader } from './examples.index';
import { asSourceFile } from '@wixc3/tsx-air-compiler/src/astUtils/parser';
import { createCjsModuleSystem } from '@file-services/commonjs';
import { createMemoryFs } from '@file-services/memory';
import { join } from 'path';
import { normalizePath, writeToFs, splitFilePath, preload, readFileOr } from './build.helpers';

const modules = createCjs();

export async function build(compiler: Compiler, load: Loader, path: string): Promise<BuiltCode> {
    const { cjs, fs, sources, pendingSources } = await modules;

    path = normalizePath(path);
    const source: string = await readFileOr(sources, path, async () => {
        const loading = pendingSources.get(path) || load(path);
        pendingSources.set(path, loading);
        loading.then(() => pendingSources.delete(path));
        return await loading;
    });

    const compiled = compiler.compile(source, path);
    writeToFs(sources, path, source);
    writeToFs(fs, path, compiled);

    // TODO: get the analyze AST from the compile pass
    const { imports } = analyze(asSourceFile(source)).tsxAir as TsxFile;

    const builtImports = imports.map(buildImport);
    return {
        source,
        compiled,
        imports: builtImports,
        module: (async () => {
            await Promise.all(builtImports);            
            return cjs.requireModule(path);
        })(),
        path
    };

    async function buildImport(i: Import): Promise<BuiltCode> {
        const { folder } = splitFilePath(path);
        const importPath = cjs.resolveFrom(folder, i.module) || join(folder, i.module);

        if (!cjs.loadedModules.has(importPath)) {
            if (importPath.indexOf('..') === 0) {
                throw new Error('Invalid import: out of example scope');
            }
            const builtModule = await build(compiler, load, importPath);
            await builtModule.module;
            return builtModule;
        }
        return {
            source: await readFileOr(sources, path, () => '// precompiled source'),
            path: importPath,
            compiled: await readFileOr(fs, path, () => '// precompiled output'),
            imports: [],
            module: Promise.resolve(cjs.requireModule(importPath))
        };
    }
}

async function createCjs() {
    const fs = createMemoryFs();
    const cjs = createCjsModuleSystem({ fs });
    const sources = createMemoryFs();

    await Promise.all([
        preload(fs, cjs, '/src/framework/index.js', import('../framework')),
        preload(fs, cjs, '/src/framework/types/component.js', import('../framework/types/component')),
        preload(fs, cjs, '/src/framework/runtime.js', import('../framework/runtime')),
        preload(fs, cjs, '/src/framework/runtime/utils.js', import('../framework/runtime/utils'))
    ]);

    const pendingSources = new Map<string, Promise<string>>();
    return { fs, cjs, sources, pendingSources };
}

export interface BuiltCode {
    source: string;
    path: string;
    compiled: string;
    imports: Array<Promise<BuiltCode>>;
    module: Promise<unknown>;
}
