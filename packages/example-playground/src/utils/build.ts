import { IFileSystem } from '@file-services/types';
import { toCommonJs } from './../compilers';
import { analyze, TsxFile, Import } from '@wixc3/tsx-air-compiler/src';
import { Compiler } from '../compilers';
import { Loader } from './examples.index';
import { asSourceFile } from '@wixc3/tsx-air-compiler/src/astUtils/parser';
import { createCjsModuleSystem, ICommonJsModuleSystem } from '@file-services/commonjs';
import { createMemoryFs } from '@file-services/memory';
import { join } from 'path';
import { normalizePath, writeToFs, splitFilePath, preload, readFileOr } from './build.helpers';


export async function build(compiler: Compiler, load: Loader, path: string, modules?: CjsEnv
): Promise<BuiltCode> {
    modules = modules || await createCjs();
    const { cjs, fs, sources, pendingSources } = modules;

    path = normalizePath(path);
    const source: string = await readFileOr(sources, path, async () => {
        const loading = pendingSources.get(path) || load(path);
        pendingSources.set(path, loading);
        loading.then(() => pendingSources.delete(path));
        return await loading;
    });
    writeToFs(sources, path, source);
    try {
        const compiled = await compiler.compile(source, path);

        // TODO: get the analyze AST from the compile pass
        const { imports } = analyze(asSourceFile(compiled)).tsxAir as TsxFile;
        const builtImports = imports.map(buildImport);
        return {
            source,
            compiled,
            imports: builtImports,
            module: (async () => {
                try {
                    await Promise.all(builtImports);
                    writeToFs(fs, path, toCommonJs(compiled));
                    return cjs.requireModule(path);
                } catch (e) {
                    console.error(e);
                }
            })(),
            path
        };
    } catch (err) {
        return {
            source,
            compiled: err,
            imports: [],
            // @ts-ignore
            module: async () => { throw new Error(err); },
            path,
            error: err
        };
    }

    async function buildImport(i: Import): Promise<BuiltCode> {
        const { folder } = splitFilePath(path);
        const importPath = cjs.resolveFrom(folder, i.module) || join(folder, i.module);

        if (!cjs.loadedModules.has(importPath)) {
            if (importPath.indexOf('..') === 0) {
                throw new Error('Invalid import: out of example scope');
            }
            const builtModule = await build(compiler, load, importPath, modules);
            await builtModule.module;
            return builtModule;
        }
        return {
            source: await readFileOr(sources, importPath, () => '// precompiled source'),
            path: importPath,
            compiled: await readFileOr(fs, importPath, () => '// precompiled output'),
            imports: [],
            module: Promise.resolve(cjs.requireModule(importPath))
        };
    }
}

interface CjsEnv {
    fs:IFileSystem;
    cjs:ICommonJsModuleSystem;
    sources:IFileSystem;
    pendingSources: Map<string, Promise<string>>;
}
async function createCjs(): Promise<CjsEnv> {
    const fs = createMemoryFs();
    const cjs = createCjsModuleSystem({ fs });
    const sources = createMemoryFs();

    await Promise.all([
        preload(fs, cjs, '/src/framework/index.js', import('../framework')),
        preload(fs, cjs, '/src/framework/types/component.js', import('../framework/types/component')),
        preload(fs, cjs, '/src/framework/types/factory.js', import('../framework/types/factory')),
        preload(fs, cjs, '/src/framework/runtime.js', import('../framework/runtime')),
        preload(fs, cjs, '/src/framework/runtime/utils.js', import('../framework/runtime/utils'))
    ]);

    const pendingSources = new Map();
    return { fs, cjs, sources, pendingSources };
}

export interface BuiltCode {
    source: string;
    path: string;
    compiled: string;
    imports: Array<Promise<BuiltCode>>;
    module: Promise<unknown>;
    error?: any;
}
