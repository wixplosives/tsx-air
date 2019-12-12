import { analyze, TsxFile, Import, asSourceFile } from '@tsx-air/compiler-utils';
import { writeToFs, readFileOr, BuiltCode, createCjs, evalModule, CjsEnv, Snippets, removeBuilt, asTsx, asJs, withoutExt } from './build.helpers';
import cloneDp from 'lodash/cloneDeep';
import isEqual from 'lodash/isEqual';
import { dirname } from 'path';
import { Compiler, Loader } from './types';


const preloads = {
    '/node_modules/@tsx-air/framework/index.js': import('@tsx-air/framework'),
    '/node_modules/lodash/clamp.js': import('lodash/clamp')
};

export async function rebuild(built: BuiltCode, overridesSources: Record<string, string>, injects: Snippets = {}): Promise<BuiltCode> {
    const { _cjsEnv, _usedBuildToold: { loader, compiler }, path } = built;
    for (const [src, source] of Object.entries(overridesSources)) {
        const oldVersion = _cjsEnv.sources.readFileSync(asTsx(src), { encoding: 'utf8' });
        if (oldVersion !== source) {
            removeBuilt(_cjsEnv, src);
            _cjsEnv.sources.writeFileSync(asTsx(src), source);
        }
    }
    for (const [src] of [...Object.entries(injects), ...Object.entries(built._injected)]) {
        if (!isEqual(built._injected[src], injects[src])) {
            removeBuilt(_cjsEnv, src);
        }
    }
    return build(compiler, loader, path, injects, _cjsEnv);
}

export async function reCompile(built: BuiltCode, newCompiler: Compiler): Promise<BuiltCode> {
    const { _cjsEnv, _usedBuildToold: { loader }, path, _injected } = built;
    const modules = await createCjs(preloads);
    modules.sources = _cjsEnv.sources;
    return build(newCompiler, loader, path, _injected, modules);
}

export async function addBreakpoint(built: BuiltCode, path: string, line: number): Promise<BuiltCode> {
    const injects = cloneDp(built._injected);
    path = asJs(path);
    injects[path] = { ...injects[path], [line]: 'debugger;' };
    return rebuild(built, {}, injects);
}

export async function removeBreakpoint(built: BuiltCode, path: string, line: number): Promise<BuiltCode> {
    const injects = cloneDp(built._injected);
    path = asJs(path);
    if (injects[path]) {
        delete injects[path][line];
    }
    return rebuild(built, {}, injects);
}

export async function build(compiler: Compiler, load: Loader, path: string,
    inject: Record<string, Record<number, string>> = {}, modules?: CjsEnv): Promise<BuiltCode> {
    modules = modules || await createCjs(preloads);
    path = withoutExt(path);
    const { cjs, compiledEsm, sources, pendingSources } = modules;
    const source: string = await readFileOr(sources, asTsx(path), loadSource);
    try {
        const compiled = await readFileOr(compiledEsm, asJs(path), () =>
            compiler.compile(source, asTsx(path)));

        const { imports } = analyze(asSourceFile(compiled)).tsxAir as TsxFile;
        const builtImports = imports.map(buildImport);
        return {
            source,
            compiled,
            imports: builtImports,
            module: Promise.all(builtImports)
                .then(() => evalModule(compiled, path, modules!, inject[asJs(path)] || {}))
            ,
            path,
            _usedBuildToold: {
                loader: load, compiler
            },
            _cjsEnv: modules!,
            _injected: inject
        };
    } catch (err) {
        return {
            source,
            compiled: err,
            imports: [],
            // @ts-ignore
            module: async () => { throw new Error(err); },
            path,
            error: err,
            _injected: inject
        };
    }

    async function loadSource(): Promise<string> {
        const loading = pendingSources.get(path) || load(withoutExt(path));
        pendingSources.set(path, loading);
        loading.then(() => pendingSources.delete(path));
        const loadedSource = await loading;
        writeToFs(sources, asTsx(path), loadedSource);
        return loadedSource;
    }

    async function buildImport(i: Import): Promise<BuiltCode> {
        const folder = dirname(path);
        const importPath = cjs.resolveFrom(folder, i.module) || compiledEsm.join(folder, i.module);

        if (!cjs.loadedModules.has(importPath)) {
            const builtModule = await build(compiler, load, importPath, inject, modules);
            await builtModule.module;
            return builtModule;
        }
        return {
            source: await readFileOr(sources, importPath, () => '// precompiled source'),
            path: importPath,
            compiled: await readFileOr(compiledEsm, importPath, () => '// precompiled output'),
            imports: [],
            module: Promise.resolve(cjs.requireModule(importPath)),
            _usedBuildToold: {
                loader: load, compiler
            },
            _cjsEnv: modules!,
            _injected: inject
        };
    }
}

export async function getSource(built: BuiltCode, path: string): Promise<string> {
    await built.module;
    return built._cjsEnv.sources.readFileSync(asTsx(path), 'utf8');
}

export async function getCompiledEsm(built: BuiltCode, path: string): Promise<string> {
    await built.module;
    return built._cjsEnv.compiledEsm.readFileSync(asJs(path), 'utf8');
}

export async function getCompiledCjs(built: BuiltCode, path: string): Promise<string> {
    await built.module;
    return built._cjsEnv.compiledCjs.readFileSync(asJs(path), 'utf8');
}
