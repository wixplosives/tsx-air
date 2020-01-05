import { TestServer } from './net';
import { Browser } from 'puppeteer';
import ts from 'typescript';
import { request, IncomingMessage } from 'http';
import { Worker } from 'worker_threads';
import isString from 'lodash/isString';
import { join } from 'path';
import { browserify } from '@tsx-air/browserify';
import { GetPage } from '@tsx-air/examples';

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