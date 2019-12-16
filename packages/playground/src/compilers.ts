import ts from 'typescript';
import { transformerCompilers } from '@tsx-air/compilers';
import { Compiler } from '../../builder/src/types';

const mappedCompilers: Compiler[] = transformerCompilers.map(compiler => {
    return {
        label: compiler.name,
        compile: async (src: string) => {
            return ts.transpileModule(src, {
                compilerOptions: {
                    jsx: ts.JsxEmit.Preserve,
                    jsxFactory: 'TSXAir',
                    target: ts.ScriptTarget.ES2020,
                    esModuleInterop: true
                },
                transformers: compiler.transformers
            }).outputText;
        }
    };
});
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
    ...mappedCompilers
]; 