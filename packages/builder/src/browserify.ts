import { nodeFs } from '@file-services/node';
import { IFileSystem } from '@file-services/types';
import { join, basename, dirname } from 'path';
import { createOverlayFs } from '@file-services/overlay';
import { promisify } from 'util';
import { createWebpackFs } from '@file-services/webpack';
import { createMemoryFs } from '@file-services/memory';
import webpack from 'webpack';
import TsconfigPathsPlugin from 'tsconfig-paths-webpack-plugin';
import { ITypeScriptLoaderOptions} from '@ts-tools/webpack-loader';

export interface BrowserifyOptions {
    base: string;
    entry: string;
    output: string;
    outputFs?: IFileSystem;
    debug?: boolean;
    configFilePath?:string;
    loaderOptions?: ITypeScriptLoaderOptions;
}

export async function browserify(options: BrowserifyOptions): Promise<string> {
    const { base, entry, output,
        outputFs = nodeFs,
        debug = false, loaderOptions = {},
        configFilePath = require.resolve('./tsconfig.json')
    } = options;

    const inputFs = createMemoryFs();

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
            plugins: [new TsconfigPathsPlugin({ configFile: require.resolve('../../../tsconfig.base.json') })]
        },
        performance: {
            hints: false
        },
        devtool: !debug ? false : 'inline-source-map'
    });

    wp.inputFileSystem = createOverlayFs(nodeFs, inputFs, base);
    // @ts-ignore
    wp.inputFileSystem.readJson = (path: string, cb: (err: Error | null, val: object | null) => void) => {
        try {
            const s = wp.inputFileSystem.readFileSync(path).toString();
            cb(null, JSON.parse(s));
        } catch (e) {
            cb(e, null);
        }
    };

    wp.outputFileSystem = createWebpackFs(outputFs || createMemoryFs());
    // @ts-ignore
    const readFile = promisify(wp.outputFileSystem.readFile);
    const run = promisify(wp.run).bind(wp);
    const res = await run();
    if (res.hasErrors()) {
        throw new Error(JSON.stringify(res.toJson().errors));
    }
    return (await readFile(output)).toString();
}
