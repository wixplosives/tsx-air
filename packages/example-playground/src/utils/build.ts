import { analyze, TsxFile, Import } from '@wixc3/tsx-air-compiler/src';
import { Compiler } from '../compilers';
import { Loader } from './examples.index';
import { asSourceFile } from '@wixc3/tsx-air-compiler/src/astUtils/parser';
import { normalizePath, writeToFs, splitFilePath, readFileOr, BuiltCode, createCjs, CjsEnv as _CjsEnv, evalModule, CjsEnv } from './build.helpers';

const preloads = {
    '/src/framework/index.js': import('../framework'),
    '/src/framework/types/component.js': import('../framework/types/component'),
    '/src/framework/types/factory.js': import('../framework/types/factory'),
    '/src/framework/runtime.js': import('../framework/runtime'),
    '/src/framework/runtime/utils.js': import('../framework/runtime/utils'),
    '/src/framework/api/types.js': import('../framework/api/types'),
    '/node_modules/lodash/clamp.js': import('lodash/clamp')
};

export async function rebuild(built: BuiltCode, overridesSources: Record<string, string>): Promise<BuiltCode> {
    const { _cjsEnv, _loader, _compiler, path } = built;
    for (const [src, source] of Object.entries(overridesSources)) {
        _cjsEnv.cjs.loadedModules.delete(src);
        _cjsEnv.compiledEsm.removeSync(src);
        _cjsEnv.sources.writeFileSync(src, source);
    }
    return build(_compiler, _loader, path, _cjsEnv);
}

export async function reCompile(built: BuiltCode, newCompiler: Compiler): Promise<BuiltCode> {
    const { _cjsEnv, _loader, path } = built;
    const modules = await createCjs(preloads);
    modules.sources = _cjsEnv.sources;
    return build(newCompiler, _loader, path, modules);
}

export async function build(compiler: Compiler, load: Loader, path: string, modules?: CjsEnv): Promise<BuiltCode> {
    modules = modules || await createCjs(preloads);
    const { cjs, compiledEsm: fs, sources, pendingSources } = modules;

    path = normalizePath(path);
    const source: string = await readFileOr(sources, path, loadSource);
    try {
        const compiled = await readFileOr(fs, path, () =>
            compiler.compile(source, path));

        // TODO: get the analyze AST from the compile pass
        const { imports } = analyze(asSourceFile(compiled)).tsxAir as TsxFile;
        const builtImports = imports.map(buildImport);
        return {
            source,
            compiled,
            imports: builtImports,
            module: Promise.all(builtImports)
                .then(() => evalModule(compiled, path, modules!))
                .catch(e => console.error(e)),
            path,
            _loader: load,
            _compiler: compiler,
            _cjsEnv: modules!
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

    async function loadSource(): Promise<string> {
        const loading = pendingSources.get(path) || load(path);
        pendingSources.set(path, loading);
        loading.then(() => pendingSources.delete(path));
        const loadedSource = await loading;
        writeToFs(sources, path, loadedSource);
        return loadedSource;
    }

    async function buildImport(i: Import): Promise<BuiltCode> {
        const { folder } = splitFilePath(path);
        const importPath = cjs.resolveFrom(folder, i.module) || fs.join(folder, i.module);

        if (!cjs.loadedModules.has(importPath)) {
            const builtModule = await build(compiler, load, importPath, modules);
            await builtModule.module;
            return builtModule;
        }
        return {
            source: await readFileOr(sources, importPath, () => '// precompiled source'),
            path: importPath,
            compiled: await readFileOr(fs, importPath, () => '// precompiled output'),
            imports: [],
            module: Promise.resolve(cjs.requireModule(importPath)),
            _loader: load,
            _compiler: compiler,
            _cjsEnv: modules!
        };
    }
}

export async function getSource(built: BuiltCode, path: string): Promise<string> {
    await built.module;
    return built._cjsEnv.sources.readFileSync(normalizePath(path), 'utf8');
}

export async function getCompiled(built: BuiltCode, path: string): Promise<string> {
    await built.module;
    return built._cjsEnv.compiledEsm.readFileSync(normalizePath(path), 'utf8');
}