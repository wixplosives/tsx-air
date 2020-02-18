import astBasedCompiler from './ast-based-compiler';
import stringBasedCompiler from './string-based-compiler';

export { astBasedCompiler, stringBasedCompiler};
export const transformerCompilers = [
     astBasedCompiler,
     stringBasedCompiler
    ];