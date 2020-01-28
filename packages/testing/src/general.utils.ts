import { safely } from '@tsx-air/utils';
export const trimCode = (code: string, dropNewLines = false) =>
    (dropNewLines ? code.replace(/\s+/gm, ' ').trim() :
        code.replace(/^[ \t]*/mg, '').replace(/[ \t]+/g, ' ')).trim().replace(/\r\n/g,'\n');

export const execute = (code: string, window: any = {}) => {
    const fn = safely(() =>
        // tslint:disable-next-line: no-eval
        eval(`(window) => {
            ${code};
        return window;}`), `Error evaluating code`);
    return safely(() => fn(window), 'Error executing code');
};
