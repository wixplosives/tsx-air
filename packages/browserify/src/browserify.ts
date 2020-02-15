import { packagePath } from '@tsx-air/utils/packages';
import { nodeFs } from '@file-services/node';
import { join, basename, dirname } from 'path';
import { promisify } from 'util';
import { createWebpackFs } from '@file-services/webpack';
import webpack from 'webpack';
import TsconfigPathsPlugin from 'tsconfig-paths-webpack-plugin';
import { ITypeScriptLoaderOptions } from '@ts-tools/webpack-loader';
import { compile } from './compile';
import { asJs } from 'packages/playground/src/build/build.helpers';

export interface BrowserifyOptions {
    base: string;
    entry: string;
    output: string;
    debug?: boolean;
    configFilePath?: string;
    loaderOptions?: ITypeScriptLoaderOptions;
}

export const browserifyPath = packagePath('@tsx-air/browserify');

export async function browserify(options: BrowserifyOptions): Promise<string> {
    const { base, entry, output,
        debug = false, loaderOptions = {}, configFilePath } = options;
    const outDir = dirname(output);
    compile([join(base, entry)], loaderOptions.transformers!, join(outDir,'src.js'));

    const wp = webpack({
        entry: join(outDir, 'src.js', asJs(entry)),
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
            extensions: ['.tsx', '.ts', '.js', '.jsx', '.json'],
            plugins: [new TsconfigPathsPlugin({
                configFile: join(browserifyPath, '..', '..', 'tsconfig.json')
            })]
        },
        performance: {
            hints: false
        },
        devtool: !debug ? false : '#source-map'
    });

    wp.outputFileSystem = createWebpackFs(nodeFs);
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
