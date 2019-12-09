import { createCjsModuleSystem } from '@file-services/commonjs';
import { createMemoryFs } from '@file-services/memory';
import { Loader } from './../../playground/src/utils/examples.index';
import { Compiler, build } from '@tsx-air/playground';
import { promisify } from 'util';
import { Page, Browser } from 'puppeteer';
import { join } from 'path';
import { createWebpackFs } from '@file-services/webpack';
import { createOverlayFs } from '@file-services/overlay';
// @ts-ignore
import webpack from 'webpack';
import nodeFs from '@file-services/node';

const readFile = promisify(nodeFs.readFile) as unknown as (path: string, options: any) => Promise<string>;

export interface ExampleSuite {
    suite: (getPage: (testTsx: string) => Promise<Page>) => Mocha.Suite;
    path: string;
}

const isSource = /\.source\.tsx?$/;

function getBuildingTools(examplePath: string) {
    const compiler: Compiler = {
        label: 'manually compiled',
        compile: async (src, path) => {
            try {
                if (isSource.test(path)) {
                    const compiledPath = join(examplePath, path.replace(isSource, '.compiled.ts'));
                    return await readFile(compiledPath, { encoding: 'utf8' });
                }
            } catch { /* use the provided src */ }
            return src;
        }
    };

    const loader: Loader = async (path: string) => {
        path = join(examplePath, path.replace('/src/', ''));
        return readFile(`${path}.tsx`, 'utf8')
            .catch(() => readFile(`${path}.ts`, 'utf8'))
            .catch(() => readFile(`${path}.js`, 'utf8'));
    };

    return { compiler, loader };
}


type GetPage = (testHtml: string) => Promise<Page>;

export function getExampleManuallyCompiledPage(
    examplePath: string,
    browser: Promise<Browser>,
    pages: Set<Promise<Page>>
): GetPage {
    const { loader, compiler } = getBuildingTools(examplePath);
    return async function getPage(testBoilerplatePath: string) {
        const boilerplate = await build(compiler, loader, testBoilerplatePath);
        await boilerplate.module;
        const cjs = createCjsModuleSystem({ fs: nodeFs });
        const TsconfigPathsPlugin = cjs.requireModule('tsconfig-paths-webpack-plugin') as any;
        const configFile = cjs.resolveFrom(__dirname, './tsconfig.json');
        const wp = webpack({
            entry: join(examplePath, 'index.suite.boilerplate.js'),
            mode: 'production',
            output: {
                filename: 'bundle.js'
            },
            module: {
                rules: [
                    {
                        test: /\.tsx?$/,
                        exclude: /node_modules/,
                        loader: '@ts-tools/webpack-loader',
                        options: {
                            configFilePath: require.resolve('./src/tsconfig.json')
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
                plugins: [new TsconfigPathsPlugin({ configFile })]
            },
        });
        wp.inputFileSystem = boilerplate._cjsEnv.compiledEsm;
        wp.inputFileSystem = createWebpackFs(createOverlayFs(nodeFs, boilerplate._cjsEnv.compiledEsm));
        // wp.inputFileSystem.resolve = (...args:any[]) => {
        //     console.log(args);
        //     rf(...args);
        // }
        wp.outputFileSystem = createMemoryFs();
        wp.run((_: any, stats: any) => {
            const info = stats.toJson();

            if (stats.hasErrors()) {
                console.error(info.errors);
            } else {
                console.log(wp.outputFileSystem.readFileSync('/bundle.js', 'utf8'));
            }

            if (stats.hasWarnings()) {
                console.warn(info.warnings);
            }

        });
        // const boilerplateBundle = await bundle();
        const page = (await browser).newPage();
        pages.add(page);
        await (await page).addScriptTag({
            content: 'boilerplateBundle'
        });
        return page;
    };
}
