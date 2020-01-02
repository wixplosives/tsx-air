import { ManuallyCompiled, isSource } from './../../../examples/src/manual.compiler';
import { analyze, TsxFile, Import, asSourceFile, compilerOptions, ReExport } from '@tsx-air/compiler-utils';
import { writeToFs, readFileOr, createCjs, evalModule, asTsx, asJs, withoutExt } from './build.helpers';
import { dirname } from 'path';
import { Compiler } from '@tsx-air/compilers';
import ts from 'typescript';
import { BuiltCode, Loader, CjsEnv } from './types';

export const preloads = {
    '/node_modules/@tsx-air/framework/index.js': import('@tsx-air/framework'),
    '/node_modules/lodash/clamp.js': import('lodash/clamp')
};

export async function build(compiler: Compiler, load: Loader, path: string,
    inject: Record<string, Record<number, string>> = {}, modules?: CjsEnv): Promise<BuiltCode> {
    modules = modules || await createCjs(preloads);
    if (compiler instanceof ManuallyCompiled) {
        compiler.contentSwapper = src => {
            const alternative = src.replace(isSource, '.compiled.tsx');
            return isSource.test(src) ?
                modules?.sources.readFileSync(alternative, { encoding: 'utf8' })
                : undefined;
        };
    }

    path = withoutExt(path);
    const { cjs, compiledEsm, sources } = modules;
    const source: string = await readFileOr(sources, asTsx(path), loadSource);
    try {
        const compiled = await readFileOr(compiledEsm, asJs(path), () => {
            const res = ts.transpileModule(source, {
                compilerOptions,
                fileName: asTsx(path),
                transformers: compiler.transformers
            });
            return res.outputText;
        });

        const { imports, reExports } = analyze(asSourceFile(compiled)).tsxAir as TsxFile;
        const builtImports = [...imports, ...reExports].map(buildImport);
        return {
            source,
            compiled,
            imports: builtImports,
            module: Promise.all(builtImports)
                .then(() => evalModule(compiled, path, modules!, inject[asJs(path)] || {}))
            ,
            path,
            _usedBuildTools: {
                loader: load, compiler
            },
            _cjsEnv: modules!,
            _injected: inject
        };
    } catch (e) {
        const err = new Error(`Error building ${path}:\n${e}`);
        err.stack = e.stack;

        return {
            source,
            compiled: err.message,
            imports: [],
            // @ts-ignore
            module: () => { throw err; },
            path,
            error: err,
            _injected: inject,
            _usedBuildTools: {
                loader: load, compiler
            },
        };
    }

    async function loadSource(): Promise<string> {
        const loading = load(withoutExt(path));
        const loadedSources = await loading;
        Object.entries(loadedSources).forEach(([filePath, content]) => {
            writeToFs(sources, asTsx(filePath), content);
        });
        return loadedSources[path];
    }

    async function buildImport(i: Import | ReExport): Promise<BuiltCode> {
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
            _usedBuildTools: {
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