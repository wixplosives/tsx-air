import { safely } from '@tsx-air/utils';
import { format } from 'prettier';
import isFunction from 'lodash/isFunction';
import { Page } from 'puppeteer';

export const trimCode = (code: string) => {
    try {
        // tslint:disable-next-line: no-eval
        const asObject = eval(`()=>(${code})`)();
        if (!isFunction(asObject)) {
            const asString = JSON.stringify(asObject, null, 2);
            if (asString !== undefined) {
                return asString;
            }
        }
    } catch { /* Try as code */ }
    try {
        return format(code, {
            bracketSpacing: true,
            arrowParens: 'avoid',
            filepath: 'tmp.ts',
            endOfLine: 'lf',
            semi: true,
            singleQuote: true,
            parser: 'typescript'
        }).replace(/(\s+$)+/gm, '');
    } catch {
        return code
            .replace(/\r/g, '')
            .replace(/\s+$/gm, '\n');
        // .replace(/\s+[^$]/g, '');
    }
};

export const execute = (code: string, window: any = {}) => {
    const fn = safely(() =>
        // tslint:disable-next-line: no-eval
        eval(`(window) => {
            ${code};
        return window;}`), `Error evaluating code`);
    return safely(() => fn(window), 'Error executing code');
};


const waitOnce = (page: Page, polling: 'raf' | 'mutation', count: number, timeout: number) =>
    page.waitForFunction((id: string, $count: number) => {
        (window as any)[id] = (window as any)[id] || $count;
        if (!--(window as any)[id]) {
            delete (window as any)[id];
        }
        console.log(!window[id]);
        return !(window as any)[id];
    },
        { polling, timeout },
        `$$waiting-${Date.now()}-${Math.random()}`, count);

export const waitAnimationFrame = (page: Page, count = 1, timeout = 1000) =>
    waitOnce(page, 'raf', count, timeout);
export const waitMutation = (page: Page, count = 1, timeout = 1000) =>
    waitOnce(page, 'mutation', count, timeout);