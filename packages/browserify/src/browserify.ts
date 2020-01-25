import { nodeFs } from '@file-services/node';
import { IFileSystem } from '@file-services/types';
import { join, basename, dirname } from 'path';
import { promisify } from 'util';
import { createWebpackFs } from '@file-services/webpack';
import { createMemoryFs } from '@file-services/memory';
import webpack from 'webpack';
import TsconfigPathsPlugin from 'tsconfig-paths-webpack-plugin';
import { ITypeScriptLoaderOptions } from '@ts-tools/webpack-loader';

export interface BrowserifyOptions {
    base: string;
    entry: string;
    output: string;
    outputFs?: IFileSystem;
    debug?: boolean;
    configFilePath?: string;
    loaderOptions?: ITypeScriptLoaderOptions;
}

export const browserifyPath = dirname(require.resolve(join('@tsx-air/browserify', 'package.json')));

export async function browserify(options: BrowserifyOptions): Promise<string> {
    const { base, entry, output,
        outputFs = nodeFs,
        debug = false, loaderOptions = {}, configFilePath } = options;

    const wp = webpack({
        entry: join(base, entry),
        mode: !debug ? 'production' : 'development',
        output: {
            filename: basename(output),
            path: dirname(output)
        },
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    exclude: /node_modules/,
                    loader: '@ts-tools/webpack-loader',
                    options: {
                        ...loaderOptions,
                        // configLookup:false,
                        configFilePath
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
            plugins: [new TsconfigPathsPlugin({
                configFile: join(browserifyPath, '..', '..', 'tsconfig.json')
            })]
        },
        performance: {
            hints: false
        },
        devtool: !debug ? false : 'inline-source-map'
    });

    wp.outputFileSystem = createWebpackFs(outputFs || createMemoryFs());
    // @ts-ignore
    const readFile = promisify(wp.outputFileSystem.readFile);
    const run = promisify(wp.run).bind(wp);
    // await baseRsConfig;
    // await tsConfig;
    const res = await run();
    if (res.hasErrors()) {
        throw new Error(`Error browserifying ${join(base, entry)}
        ${ res.toString()} `);
    }
    return (await readFile(output)).toString();
}
