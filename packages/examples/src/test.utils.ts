import { expect } from 'chai';
import { TestServer } from './testserver';
import { Compiler, BuildTools, Loader, staticBuild } from '@tsx-air/builder';
import { promisify } from 'util';
import { Page, Browser } from 'puppeteer';
import { join } from 'path';
import nodeFs from '@file-services/node';
import ts from 'typescript';
import { request, IncomingMessage } from 'http';
import { fail } from 'assert';
import { Worker } from 'worker_threads';
import isString from 'lodash/isString';
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
                    return ts.transpileModule(await readFile(compiledPath, { encoding: 'utf8' }), {
                        compilerOptions: {
                            jsx: ts.JsxEmit.Preserve,
                            jsxFactory: 'TSXAir',
                            target: ts.ScriptTarget.ES2020,
                            module: ts.ModuleKind.ES2015,
                            esModuleInterop: true
                        }
                    }).outputText;
                }
            } catch { /* use the provided src */ }
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
    getBrowser: () => Browser,
    getServer: () => TestServer
): GetPage {
    const { loader, compiler } = getBuildingTools(examplePath);
    return async function getPage(testBoilerplatePath: string) {
        const [server, browser] = [getServer(), getBrowser()];
        try {
            // const builtCode = await build(compiler, loader, testBoilerplatePath);
            const boilerplate = await staticBuild(compiler, loader, examplePath, testBoilerplatePath);
            server.addEndpoint('/index.html', `<html>
                <body>
                    <div></div>
                    <script src="/boilerplate.js"></script>
                </body>
            </html>`);
            server.addEndpoint('/boilerplate.js', boilerplate);
        } catch (e) {
            fail(e);
        }
        const page = await browser.newPage();
        const url = `${await server.baseUrl}/index.html`;
        const pageErrors: Error[] = [];
        page.on('pageerror', (e: Error) => {
            pageErrors.push(e);
        });
        await page.goto(url);
        expect(pageErrors, 'Page contains errors').to.eql([]);
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

export async function threadedGet(url: string): Promise<{result:string, time:number}> {
    const _id = Date.now() + '+' + Math.random();
    const getter = new Worker(require.resolve('./testclient.get.worker'));
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

export function block(duration:number) {
    // The main thread is now blocked
    const start = Date.now();
    while (Date.now() - start < duration) {
        // block for [duration] mSec
    }
    const end = Date.now();
    return [start, end];
}