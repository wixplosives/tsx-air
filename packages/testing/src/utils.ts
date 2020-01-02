import { TestServer } from './net';
import { Browser } from 'puppeteer';
import ts from 'typescript';
import { request, IncomingMessage } from 'http';
import { Worker } from 'worker_threads';
import isString from 'lodash/isString';
import { join } from 'path';
import { browserify } from '@tsx-air/browserify/src';
import { GetPage } from '@tsx-air/examples';

export function getCompiledPage(
    transformers: ts.CustomTransformers,
    examplePath: string,
    getBrowser: () => Browser,
    getServer: () => TestServer
): GetPage {
    return async function getPage(testBoilerplatePath: string) {
        const [browser, server] = [getBrowser(), getServer()];
        const boilerplate = await browserify({
            base: examplePath,
            entry: testBoilerplatePath,
            output: join(__dirname, '../.tmp/builerplate.js'),
            debug: !!process.env.DEBBUG,
            loaderOptions: {
                transformers,
                cache: false
            }
        });
        try {
            // compiler, loader, examplePath, testBoilerplatePath);
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
            throw new Error('Error running test server\n' + e);
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
    const getter = new Worker(require.resolve('./server/threaded.get.worker'));
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