import { asTs, asJs } from './../../builder/src/build.helpers';
import { Compiler } from '@tsx-air/compilers';
import ts from 'typescript';
import { Loader, asTsx } from '@tsx-air/builder';
import { join } from 'path';
import { readFileSync } from 'fs';
import { trimCode } from './general.utils';
import { fileExistsSync } from 'tsconfig-paths/lib/filesystem';

export const trivialCompiler: Compiler = {
    transformers: undefined as unknown as ts.CustomTransformers,
    label: 'copier'
};

export interface DebuggableLoader extends Loader {
    loaded: string[];
    path: string;
}

export function jsLoaderFromPath(path: string, strictExt = true): DebuggableLoader {
    const load: DebuggableLoader = async url => {
        load.loaded.push(url);
        const filePath = join(path, `${url}`);
        if (fileExistsSync(filePath)) {
            return trimCode(readFileSync(filePath, { encoding: 'utf8' }));
        }
        if (!strictExt) {
            for (const withExt of [asTsx, asTs, asJs]) {
                if (fileExistsSync(withExt(filePath))) {
                    return trimCode(readFileSync(withExt(filePath), { encoding: 'utf8' }));
                }
            }
        }
        throw new Error(`missing URL: ${url} (path: ${filePath})`);
    };
    load.loaded = [];
    load.path = path;
    return load;
}
