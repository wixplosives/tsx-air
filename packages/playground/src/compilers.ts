import ts from 'typescript';
import { compilers as transfomerCompilers } from '@tsx-air/compilers';
import { Compiler } from '../../builder/src/types';

const mappedCompilers: Compiler[] = transfomerCompilers.map(compiler => {
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
        path = path.replace(/^\/src/, '').replace(/source(\.js|\.ts|\.tsx)?$/, '/compiled');
        path = path.replace(/\.js*/, '');
        const content = await (await fetch(path)).text();
        return content;
    }
};

export const compilers: Compiler[] = [
    manualCompiler,
    ...mappedCompilers
]; 