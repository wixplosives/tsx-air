import ts from 'typescript';
import astBasedCompiler from '@wixc3/tsx-air-compilers/src/ast-based-compiler';
import stringBasedCompiler from '@wixc3/tsx-air-compilers/src/string-based-compiler';
// import { tsxAirTransformer } from '@wixc3/tsx-air-compiler/src/transformers/generators/tsx-air-comp-transformer';

export interface Compiler {
    compile: (src: string, path: string) => Promise<string>;
    label: string;
}

export const toCommonJs = (source: string) => ts.transpileModule(source, {
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
            path = path.replace(/^\/src/, '').replace(/source(\.js|\.ts|\.tsx)?$/, '/compiled');
            path = path.replace(/\.js*/, '');
            const content = await (await fetch(path)).text();
            return content;
        }
    },
    {
        label: 'String based compiler',
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
                    before: [stringBasedCompiler.transformer]
                }
            }).outputText;

            return preCompiled;
        }
    },
    {
        label: 'AST based compiler',
        compile: async (src, _exp) => {
            const compiled = ts.transpileModule(src, {
                compilerOptions: {
                    jsx: ts.JsxEmit.React,
                    jsxFactory: 'TSXAir',
                    target: ts.ScriptTarget.ES2020,
                    esModuleInterop: true
                },
                transformers: {
                    before: [astBasedCompiler]
                }
            }).outputText;
            return compiled;
        }
    }
]; 