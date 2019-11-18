import { IFileSystem } from '@file-services/types';
import { ICommonJsModuleSystem } from '@file-services/commonjs';

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
