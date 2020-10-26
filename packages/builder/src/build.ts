import { nodeFs } from '@file-services/node';
import { join, basename, dirname } from 'path';
import { promisify } from 'util';
import { createWebpackFs } from '@file-services/webpack';
import webpack from 'webpack';
import TsconfigPathsPlugin from 'tsconfig-paths-webpack-plugin';
import { compile } from './compile';
import { packagePath } from '@tsx-air/utils/packages';
import { Compiler } from '@tsx-air/types';
import { asJsX } from '@tsx-air/utils';

export interface BuildOptions {
    base: string;
    entry: string;
    output: string;
    debug?: boolean;
    configFilePath?: string;
    compiler: Compiler;
}

const builderPath = packagePath('@tsx-air/builder');

export async function build(options: BuildOptions): Promise<string> {
    const { base, entry, output,
        debug = false, configFilePath } = options;
    const outDir = dirname(output);
    compile([join(base, entry)], options.compiler, join(outDir, 'src.js'));
    const files = (await nodeFs.promises.readdir(base)).filter(name => name.endsWith('.compiled.ts'));
    await Promise.all(
        files.map(file => nodeFs.promises.copyFile(nodeFs.join(base, file), nodeFs.join(outDir, 'src.js', file)))
    );

    const wp = webpack({
        entry: join(outDir, 'src.js', asJsX(entry)),
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
                configFile: join(builderPath, '..', '..', 'tsconfig.json')
            })]
        },
        performance: {
            hints: false
        },
        devtool: !debug ? false : 'source-map'
    });

    wp.outputFileSystem = createWebpackFs(nodeFs);
    // @ts-ignore
    const readFile = promisify(wp.outputFileSystem.readFile);
    const run = promisify(wp.run.bind(wp));
    const res = await run();
    if (res.hasErrors()) {
        throw new Error(`Error building ${join(base, entry)}
        ${ res.toString()} `);
    }
    return (await readFile(output)).toString();
}
