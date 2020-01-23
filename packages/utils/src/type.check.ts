type IsOfType = (x: any) => boolean;
type TypeCheck = IsOfType | 'string' | 'number' | 'function' | 'object' | 'undefined' | 'boolean';

/**
 * Returns true if x is defined and matched NONE of the allowed types
 * @param x 
 * @param allowedTypes type checkers of allowed typeof vale (i.e. 'string', 'function' etc)
 */
export const isWrongType = (x: any, ...allowedTypes: TypeCheck[]) => {
    if (x !== undefined) {
        return !allowedTypes.some(
            type => typeof type === 'function' ? type(x) : typeof x === type
        );
    }
    return false;
};

export const isArrayOf = (x: any, isOf: TypeCheck, emptyPasses = true) =>
    x instanceof Array
    && (x.length > 0 || emptyPasses)
    && x.every(i =>
        (typeof isOf === 'string' && typeof i === isOf)
        || (typeof isOf === 'function' && isOf(i)));
