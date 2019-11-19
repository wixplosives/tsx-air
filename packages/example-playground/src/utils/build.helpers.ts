import { IFileSystem } from '@file-services/types';
import { ICommonJsModuleSystem, createCjsModuleSystem } from '@file-services/commonjs';
import { createMemoryFs } from '@file-services/memory';
import { Compiler, toCommonJs } from '../compilers';
import { Loader } from './examples.index';

export async function preload(fs: IFileSystem, cjs: ICommonJsModuleSystem, filename: string, module: Promise<unknown>) {
    writeToFs(fs, filename, '// Preloaded');
    cjs.loadedModules.set(filename, {
        filename,
        exports: await module
    });
}

export function splitFilePath(path: string) {
    const mp = path.split('/').filter(i => i);
    const folder = '/' + mp.slice(0, -1).join('/');
    const file = mp[mp.length - 1];
    return { folder, file };
}


export function writeToFs(fs: IFileSystem, path: string, code: string) {
    const { file, folder } = splitFilePath(path);
    try {
        fs.writeFileSync(path, code);
    }
    catch {
        fs.populateDirectorySync(folder, {
            [file]: code
        });
    }
}

export function normalizePath(path: string): string {
    return path.replace(/\.js$/, '') + '.js';
}

export async function readFileOr(fs: IFileSystem, path: string, orElse: () => string | Promise<string>) {
    if (fs.fileExistsSync(path)) {
        return fs.readFileSync(path, 'utf8');
    }
    return await orElse();
}

export interface BuiltCode {
    source: string;
    path: string;
    compiled: string;
    imports: Array<Promise<BuiltCode>>;
    module: Promise<unknown>;
    error?: any;
    _loader: Loader;
    _compiler: Compiler;
    _cjsEnv: CjsEnv;
}

export interface CjsEnv {
    compiledEsm: IFileSystem;
    cjs: ICommonJsModuleSystem;
    sources: IFileSystem;
    pendingSources: Map<string, Promise<string>>;
}
export async function createCjs(preloads: Record<string, Promise<unknown>>): Promise<CjsEnv> {
    const commonJs = createMemoryFs();
    const cjs = createCjsModuleSystem({ fs: commonJs });
    const sources = createMemoryFs();

    await Promise.all(
        Object.entries(preloads).map(([filename, module]) =>
            preload(commonJs, cjs, filename, module)));

    const pendingSources = new Map();
    return { compiledEsm: commonJs, cjs, sources, pendingSources };
}

export function evalModule(compiled: string, path: string, { cjs, compiledEsm }:CjsEnv ) {
    cjs.loadedModules.delete(path);
    writeToFs(compiledEsm, path, toCommonJs(compiled));
    const exports = cjs.requireModule(path);
    writeToFs(compiledEsm, path, compiled);
    return exports;
}