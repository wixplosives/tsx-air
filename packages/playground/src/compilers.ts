import ts from 'typescript';
import { transformerCompilers, Compiler } from '@tsx-air/compilers';

const manualCompiler: Compiler = {
    label: 'Manual + TS',
    compile: async (_src, path) => {
        path = path.replace(/^\/src/, '').replace(/\.source/, '.compiled');
        path = path.replace(/\.(js|ts|tsx)+$/, '');
        const content = await (await fetch(path)).text();
        return content;
    }
};

export const compilers: Compiler[] = [
    manualCompiler,
    ...transformerCompilers
]; 