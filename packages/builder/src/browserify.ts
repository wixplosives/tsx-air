import { promisify } from 'util';
import { createWebpackFs } from '@file-services/webpack';
import { createMemoryFs } from '@file-services/memory';
import { IFileSystem } from '@file-services/types';
import { createOverlayFs } from '@file-services/overlay';
import nodeFs from '@file-services/node';
import webpack from 'webpack';
import { join } from 'path';

export async function browserify(fs: IFileSystem, entry: string, dirname:string) {
    const wp = webpack({
        entry: join(dirname, entry),
        mode: 'production',
        output: {
            filename: 'bundle.js',
            path: '/'
        }
    });

    wp.inputFileSystem = createOverlayFs(nodeFs, fs, dirname);
    const output = createMemoryFs();
    const readFile = promisify(output.readFile) as unknown as (path: string, options: any) => Promise<string>;
    wp.outputFileSystem = createWebpackFs(output);
    const run = promisify(wp.run).bind(wp);
    const res = await run();
    if (res.hasErrors()) {
        throw new Error(JSON.stringify(res.toJson().errors));
    }
    return readFile('/bundle.js', 'utf8');
}