import { TestServer } from './testserver';
import { Compiler, BuildTools, Loader, build, getBrowserified } from '@tsx-air/builder';
import { promisify } from 'util';
import { Page, Browser } from 'puppeteer';
import { join } from 'path';
import nodeFs from '@file-services/node';
import ts from 'typescript';
import { request, IncomingMessage } from 'http';
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
        const boilerplate = await getBrowserified(await build(compiler, loader, testBoilerplatePath), examplePath);
        server.addEndpoint('/index.html', `<html>
            <body>
                <div></div>
                <script src="/boilerplate.js"></script>
            </body>
        </html>`);
        server.addEndpoint('/boilerplate.js', boilerplate);
        const page = await browser.newPage();
        const url = `${await server.baseUrl}/index.html`;
        await page.goto(url);
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
