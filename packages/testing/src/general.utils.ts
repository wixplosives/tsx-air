export const trimCode = (code: string, dropNewLines = false) =>
    (dropNewLines ? code.replace(/\s+/gm, ' ') :
        code.replace(/^[ \t]*/mg, '').replace(/[ \t]+/g, ' ')).trim();

export const execute = (code: string, window: any = {}) =>
    // tslint:disable-next-line: no-eval
    eval(`(window) => {${code};
        return window;}`)(window);
