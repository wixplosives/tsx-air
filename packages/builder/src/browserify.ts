import { createMemoryFs } from '@file-services/memory';
import nodeFs from '@file-services/node';
import { createOverlayFs } from '@file-services/overlay';
import { IFileSystem } from '@file-services/types';
import { createWebpackFs } from '@file-services/webpack';
import { join } from 'path';
import { TsconfigPathsPlugin } from 'tsconfig-paths-webpack-plugin';
import { promisify } from 'util';
import webpack from 'webpack';

export async function browserify(fs: IFileSystem, entry: string, dirname: string): Promise<string> {
    const wp = webpack({
        entry: join(dirname, entry),
        mode: !process.env.DEBUG?'production':'development',
        output: {
            filename: 'bundle.js',
            path: '/'
        },
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    exclude: /node_modules/,
                    loader: '@ts-tools/webpack-loader',
                    options: {
                        configFilePath: require.resolve('./tsconfig.json')
                    }
                },
                {
                    test: /\.d\.ts$/,
                    include: /node_modules/,
                    loader: 'raw-loader'
                }
            ]
        },
        resolve: {
            extensions: ['.tsx', '.ts', '.js', '.json'],
            plugins: [new TsconfigPathsPlugin({ configFile: require.resolve('../../../tsconfig.base.json') })]
        },
        performance: {
            hints: false
        },
        devtool: !process.env.DEBUG ? 'nosources-source-map' : 'inline-source-map' ,
    });

    wp.inputFileSystem = createOverlayFs(nodeFs, fs, dirname);
    // @ts-ignore
    wp.inputFileSystem.readJson = (path: string, cb: (err: Error | null, val: object | null) => void) => {
        try {
            const s = wp.inputFileSystem.readFileSync(path).toString();
            cb(null, JSON.parse(s));
        } catch (e) {
            cb(e, null);
        }
    };
    const output = createMemoryFs();
    const readFile = promisify(output.readFile);
    wp.outputFileSystem = createWebpackFs(output);
    const run = promisify(wp.run).bind(wp);
    const res = await run();
    if (res.hasErrors()) {
        throw new Error(JSON.stringify(res.toJson().errors));
    }
    return (await readFile('/bundle.js')).toString();
}