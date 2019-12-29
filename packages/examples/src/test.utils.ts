import { expect } from 'chai';
import { TestServer } from './testserver';
import { Compiler, BuildTools, Loader, staticBuild } from '@tsx-air/builder';
import { promisify } from 'util';
import { Page, Browser, launch } from 'puppeteer';
import { join } from 'path';
import nodeFs from '@file-services/node';
import ts from 'typescript';
import { request, IncomingMessage } from 'http';
import { fail } from 'assert';
import { Worker } from 'worker_threads';
import isString from 'lodash/isString';
import { readFileSync } from 'fs';
const readFile = promisify(nodeFs.readFile) as unknown as (path: string, options: any) => Promise<string>;

export interface ExampleSuite {
    suite: (getPage: (testTsx: string) => Promise<Page>) => Mocha.Suite;
    path: string;
}

const isSource = /\.source\.tsx?$/;

function getBuildingTools(): BuildTools {
    const compiler: Compiler = {
        label: 'manually compiled',
        compile: async (src, path) => {
            try {
                if (isSource.test(path)) {
                    const compiledPath = path.replace(isSource, '.compiled.ts');
                    return ts.transpileModule(readFileSync(compiledPath, { encoding: 'utf8' }), {
                        compilerOptions: {
                            jsx: ts.JsxEmit.Preserve,
                            jsxFactory: 'TSXAir',
                            target: ts.ScriptTarget.ES2020,
                            module: ts.ModuleKind.ES2015,
                            esModuleInterop: true
                        }
                    }).outputText;
                }
            } catch (e) {
                console.error(e);
                /* use the provided src */
            }
            return ts.transpileModule(src, {
                compilerOptions: {
                    jsx: ts.JsxEmit.Preserve,
                    jsxFactory: 'TSXAir',
                    target: ts.ScriptTarget.ES2020,
                    module: ts.ModuleKind.ES2015,
                    esModuleInterop: true
                }
            }).outputText;
        }
    };

    const loader: Loader = async (path: string) => {
        // path = join(examplePath, path.replace('/src/', ''));
        return readFile(`${path}.tsx`, 'utf8')
            .catch(() => readFile(`${path}.ts`, 'utf8'))
            .catch(() => readFile(`${path}.js`, 'utf8'));
    };

    return { compiler, loader };
}

type GetPage = (testHtml: string) => Promise<Page>;

export function getExampleManuallyCompiledPage(
    examplePath: string,
    getBrowser: () => Browser,
    getServer: () => TestServer
): GetPage {
    const { loader, compiler } = getBuildingTools();
    return async function getPage(testBoilerplatePath: string) {
        const [browser, server] = [getBrowser(), getServer()];
        try {
            const server = getServer();
            // const builtCode = await build(compiler, loader, testBoilerplatePath);
            const boilerplate = await staticBuild(compiler, loader, examplePath, testBoilerplatePath);
            await Promise.all([
                server.addEndpoint('/index.html', `<html>
                    <body>
                        <div></div>
                        <script src="/boilerplate.js"></script>
                    </body>
                </html>`),
                server.addEndpoint('/boilerplate.js', boilerplate)
            ]);
        } catch (e) {
            throw new Error('Error running test server\n'+e);
        }
        const page = browser.newPage();
        const url = `${await server.baseUrl}/index.html`;
        const pageErrors: Error[] = [];
        (await page).on('pageerror', (e: Error) => {
            pageErrors.push(e);
        });
        await (await page).goto(url);
        if (pageErrors.length) {
            throw new Error('Test boilerplate page contains the following errors\n\tTip: use "DEBUG=true yarn test" to debug in browser\n\n' + pageErrors.join('\'n'));
        }
        return page;
    };
}

export const get = (url: string) => new Promise((resolve, reject) => {
    request(url, {
        method: 'GET'
    }, (res: IncomingMessage) => {
        if (res.statusCode! >= 400) {
            reject(res.statusCode);
        } else {
            res.setEncoding('utf8');
            let rawData = '';
            res.on('data', (chunk: string) => { rawData += chunk; });
            res.on('end', () => {
                resolve(rawData);
            });
        }
    }).end();
});

export async function threadedGet(url: string): Promise<{ result: string, time: number }> {
    const _id = Date.now() + '+' + Math.random();
    const getter = new Worker(require.resolve('./threaded.get.worker'));
    return new Promise((resolve, reject) => {
        getter.on('message', (m: any) => {
            const { id, result } = m;
            if (id === _id) {
                if (isString(result)) {
                    resolve(m);
                } else {
                    reject(m);
                }
                getter.terminate();
            }
        });
        getter.postMessage({ type: 'get', url, id: _id });
    });
}

export function block(duration: number) {
    // The main thread is now blocked
    const start = Date.now();
    while (Date.now() - start < duration) {
        // block for [duration] mSec
    }
    const end = Date.now();
    return [start, end];
}