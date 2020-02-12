import { safely } from '@tsx-air/utils';
import { format } from 'prettier';
import { isObject } from 'lodash';
import { isNumber } from 'util';
import isFunction from 'lodash/isFunction';

export const trimCode = (code: string) => {
    try {
        const asObject = eval(`()=>(${code})`)();
        if (!isFunction(asObject)) {
            return JSON.stringify(asObject, null, 2);
        }
    } catch {/**Try as code */}
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
            .replace(/\s+$/gm, '\n')
            .replace(/\s+[^$]/g, '');
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
