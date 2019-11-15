import { transformers } from '@wixc3/tsx-air-compiler/src';
import ts from 'typescript';

export interface Compiler {
    compile: (src: string, path: string) => Promise<string>;
    label: string;
}
const toCommonJs = (source: string) => ts.transpileModule(source, {
    compilerOptions: {
        jsx: ts.JsxEmit.Preserve,
        jsxFactory: 'TSXAir',
        target: ts.ScriptTarget.ES2020,
        module: ts.ModuleKind.CommonJS,
        esModuleInterop: true
    }
}).outputText;

export const compilers: Compiler[] = [
    {
        label: 'Manual + TS',
        compile: async (_src, path) => {            
            path = path.replace(/^\/src/,'').replace(/source(\.js|\.ts|\.tsx)?$/,'/compiled');
            const content = await (await fetch(path)).text();
            return toCommonJs(content);
        }
    },
    {
        label: 'Compiler 1',
        compile: async (src, _exp) => {
            const preCompiled = ts.transpileModule(src, {
                compilerOptions: {
                    jsx: ts.JsxEmit.Preserve,
                    jsxFactory: 'TSXAir',
                    target: ts.ScriptTarget.ES2020,
                    // module: ts.ModuleKind.CommonJS,
                    esModuleInterop: true
                },
                transformers: {
                    before: transformers.map(item => item.transformer)
                }
            }).outputText;
            
            return toCommonJs(preCompiled);
        }
    }
]; 