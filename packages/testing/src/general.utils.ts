export const trimCode = (code: string, dropNewLines = false) =>
    (dropNewLines ? code.replace(/\s+/gm, ' ') :
        code.replace(/^[ \t]*/mg, '').replace(/[ \t]+/g, ' ')).trim();

export const execute = (code: string, window: any = {}) =>
    // tslint:disable-next-line: no-eval
    eval(`(window) => {
        try {
            ${code};
        } catch (err) {
            const newErr = new Error('Error evaluating script');
            newErr.stack = err.stack;
            throw newErr;
        }
        return window;}`)(window);
