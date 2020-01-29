import { safely } from '@tsx-air/utils';
import { format } from 'prettier';

export const trimCode = (code: string) => {
    try {
        return format(code, {
            bracketSpacing: true,
            arrowParens: 'avoid',
            filepath: 'tmp.js',
            endOfLine: 'lf',
            semi: true,
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
