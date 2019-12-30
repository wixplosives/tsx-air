import { createMemoryFs } from '@file-services/memory';
import { IDirectoryContents } from '@file-services/types';
import { IMemFileSystem } from '@file-services/memory';
import { Compiler } from '@tsx-air/compilers';
import ts from 'typescript';
import { Loader } from '@tsx-air/builder';

export const trivialCompiler: Compiler = {
    transformers: undefined as unknown as ts.CustomTransformers,
    label: 'copier'
};

export interface DebuggableLoader extends Loader {
    loaded: string[];
    fs: IMemFileSystem;
}

export function jsLoaderFrom(content: IDirectoryContents): DebuggableLoader {
    const load: DebuggableLoader = async path => {
        load.loaded.push(path);
        return trimCode(load.fs.readFileSync(`${path}.js`, 'utf8'));
    };
    load.loaded = [];
    load.fs = createMemoryFs(content);
    return load;
}

export const trimCode = (code: string, dropNewLines = false) =>
    (dropNewLines ? code.replace(/\s+/gm, ' ') :
        code.replace(/^[ \t]*/mg, '').replace(/[ \t]+/g, ' ')).trim();

export const execute = (code: string, window: any = {}) =>
    // tslint:disable-next-line: no-eval
    eval(`(window) => {${code};
        return window;}`)(window);
