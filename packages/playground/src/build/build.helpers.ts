import { safely } from '@tsx-air/utils';
import { IFileSystem } from '@file-services/types';
import { ICommonJsModuleSystem, createCjsModuleSystem } from '@file-services/commonjs';
import { createMemoryFs } from '@file-services/memory';
import flatMap from 'lodash/flatMap';
import { dirname, basename } from 'path';
import { toCommonJs } from '@tsx-air/utils';
import { CjsEnv, FileSnippets } from './types';
import { asJs } from 'packages/utils/src/filenames';

export async function preload(fs: IFileSystem, cjs: ICommonJsModuleSystem, filename: string, module: Promise<unknown>) {
    writeToFs(fs, filename, '// Preloaded');
    cjs.loadedModules.set(filename, {
        filename,
        exports: await module,
        id: filename
    });
}

export function writeToFs(fs: IFileSystem, path: string, code: string) {
    try {
        fs.writeFileSync(path, code);
    }
    catch {
        fs.populateDirectorySync(dirname(path), {
            [basename(path)]: code
        });
    }
}

export async function readFileOr(fs: IFileSystem, path: string, orElse: () => string | Promise<string>) {
    path = fs.resolve(path);
    if (path && fs.fileExistsSync(path)) {
        return fs.readFileSync(path, 'utf8');
    }
    return await orElse();
}

export async function createCjs(preloads: Record<string, Promise<unknown>>): Promise<CjsEnv> {
    const compiledEsm = createMemoryFs();
    const compiledCjs = createMemoryFs();
    const sources = createMemoryFs();
    const cjs = createCjsModuleSystem({ fs: compiledCjs });

    await Promise.all(
        Object.entries(preloads).map(([filename, module]) =>
            preload(compiledCjs, cjs, filename, module)));

    return { compiledEsm, compiledCjs, cjs, sources };
}

export function injectSnippets(code: string, injects: FileSnippets) {
    return flatMap(code.split('\n'),
        (line, num) => injects[num + 1] ? [injects[num + 1], line] : line).join('\n');
}

export function evalModule(compiled: string, path: string, env: CjsEnv, inject: FileSnippets) {
    const { cjs, compiledCjs, compiledEsm } = env;
    const jsPath = asJs(path);
    cjs.loadedModules.delete(jsPath);
    return safely(()=>{
        const modifiedCode = injectSnippets(compiled, inject);
        const asCommonJs = toCommonJs(modifiedCode);
        writeToFs(compiledCjs, jsPath, asCommonJs);
        const exports = cjs.requireModule(jsPath);
        writeToFs(compiledEsm, jsPath, compiled);
        return exports;
    }, `Error evaluating ${path}`);
}

export function removeBuilt(env: CjsEnv, path: string) {
    env.cjs.loadedModules.delete(asJs(path));
    env.cjs.loadedModules.delete(path);
    // tslint:disable-next-line: no-unused-expression
    env.compiledEsm.fileExistsSync(asJs(path)) && env.compiledEsm.removeSync(asJs(path));
    // tslint:disable-next-line: no-unused-expression
    env.compiledCjs.fileExistsSync(asJs(path)) && env.compiledCjs.removeSync(asJs(path));
}
