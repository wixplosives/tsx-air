export function safely<T>(fn: () => T, errorMessage: string): T {
    try {
        let res = fn();
        if (typeof (res as any)?.catch === 'function') {
            res = (res as any).catch((err: any) => {
                throw newError(errorMessage, err);
            });
        }
        return res;
    } catch (err) {
        throw newError(errorMessage, err);
    }
}

function newError(errorMessage: string, err?: any): Error {
    const newErr = new Error(errorMessage + ((!err || err instanceof Error) ? '' : ('\n' + err)));
    newErr.stack = stackOf(err);
    return newErr;
}

function stackOf(e?: Error): string {
    const stack = e?.stack || new Error().stack || '';
    return stack.split('\n').filter(s => s.indexOf('safe.do.ts') < 0).join();
}