import { Loader } from './types';
import { trimCode } from '@tsx-air/testing';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { asTsx, asTs, asJs } from './build.helpers';

export interface DebuggableLoader extends Loader {
    loaded: string[];
    path: string;
}

export function jsLoaderFromPath(path: string, strictExt = true): DebuggableLoader {
    const load: DebuggableLoader = async url => {
        load.loaded.push(url);
        const filePath = join(path, `${url}`);
        if (existsSync(filePath)) {
            return {
                [path]: trimCode(readFileSync(filePath, { encoding: 'utf8' }))
            };
        }
        if (!strictExt) {
            for (const withExt of [asTsx, asTs, asJs]) {
                if (existsSync(withExt(filePath))) {
                    return {
                        [path]: trimCode(readFileSync(withExt(filePath), { encoding: 'utf8' }))
                    };
                }
            }
        }
        throw new Error(`missing URL: ${url} (path: ${filePath})`);
    };
    load.loaded = [];
    load.path = path;
    return load;
}
