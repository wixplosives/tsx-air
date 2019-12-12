import { Compiler, BuildTools, Loader, asJs, build } from '@tsx-air/builder';
import { createMemoryFs } from '@file-services/memory';
import { promisify } from 'util';
import { Page, Browser } from 'puppeteer';
import { join } from 'path';
import { createWebpackFs } from '@file-services/webpack';
import { createOverlayFs } from '@file-services/overlay';
// @ts-ignore
import webpack from 'webpack';
import nodeFs from '@file-services/node';
import TsconfigPathsPlugin from 'tsconfig-paths-webpack-plugin';
const readFile = promisify(nodeFs.readFile) as unknown as (path: string, options: any) => Promise<string>;

export interface ExampleSuite {
    suite: (getPage: (testTsx: string) => Promise<Page>) => Mocha.Suite;
    path: string;
}

const isSource = /\.source\.tsx?$/;

function getBuildingTools(examplePath: string): BuildTools {
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
    browser: Browser,
    pages: Set<Page>
): GetPage {
    const { loader, compiler } = getBuildingTools(examplePath);
    return async function getPage(testBoilerplatePath: string) {
        const boilerplate = await build(compiler, loader, testBoilerplatePath);
        await boilerplate.module;
        const wp = webpack({
            entry: join(examplePath, asJs(testBoilerplatePath)),
            mode: 'production',
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
        });
        wp.inputFileSystem = boilerplate._cjsEnv.compiledEsm;
        wp.inputFileSystem = createWebpackFs(createOverlayFs(boilerplate._cjsEnv.compiledEsm, nodeFs));
        wp.inputFileSystem.readJson = (src: string) => JSON.parse(nodeFs.readFileSync(src, 'utf8'));
        wp.outputFileSystem = createWebpackFs(createMemoryFs());
        wp.run = promisify(wp.run);
        console.log((await wp.run()).toJson());
        // wp.run((err: any, stats: any) => {
        //     if (err) {
        //         console.error(err);
        //     }
        // console.log('done:', wp.outputFileSystem.readFileSync('/bundle.js', 'utf8'));
        //     const info = stats.toJson();
        //     if (stats.hasErrors()) {
        //         console.error(info.errors);
        //     } else {
        //         console.log(wp.outputFileSystem.readFileSync('/bundle.js', 'utf8'));
        //     }
        //     if (stats.hasWarnings()) {
        //         console.warn(info.warnings);
        //     }
        // });
        // const boilerplateBundle = await bundle();
        console.log('done:', wp.outputFileSystem.readFileSync('/bundle.js', 'utf8'));

        const page = await browser.newPage();
        pages.add(page);
        await page.addScriptTag({
            content: wp.outputFileSystem.readFileSync('/bundle.js', 'utf8')
        });
        return page;
    };
}

// export async function compileAndBundle(entryPath: string, { compiler, loader }: BuildTools): Promise<string> {
// }