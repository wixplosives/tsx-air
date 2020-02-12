import { safely } from '@tsx-air/utils';
import { format } from 'prettier';
import isFunction from 'lodash/isFunction';

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
