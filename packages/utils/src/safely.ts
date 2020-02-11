export function safely<T>(fn: () => T, errorMessage: string, assertion: (v: any) => boolean = () => true): T {
    try {
        let res = fn();
        if (typeof (res as any)?.catch === 'function' && typeof (res as any)?.then === 'function') {
            res = (res as any)
                .then((v:any) => assertion(v) ? v : Promise.reject(new Error('Assertion error')))
            .catch((err: any) => {
                throw newError(errorMessage, err);
            });
        } else {
            if (!assertion(res)) {
                throw new Error('Assertion error');
            }
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