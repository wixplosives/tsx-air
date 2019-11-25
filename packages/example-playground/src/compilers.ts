import { transformers } from '@wixc3/tsx-air-compiler/src';
import ts from 'typescript';
import { appendNodeTransformer } from '@wixc3/tsx-air-compiler/src/transformers/generators/append-node-transformer';
import { fragmentTransformer } from '@wixc3/tsx-air-compiler/src/transformers/generators/jsx-fragment-transformer';
import { tsxAirTransformer } from '@wixc3/tsx-air-compiler/src/transformers/generators/tsx-air-comp-transformer';

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

            return preCompiled;
        }
    },
    {
        label: 'jsx only',
        compile: async (src, _exp) => {
            const compiled = ts.transpileModule(src, {
                compilerOptions: {
                    jsx: ts.JsxEmit.React,
                    jsxFactory: 'TSXAir',
                    target: ts.ScriptTarget.ES2020,
                    module: ts.ModuleKind.CommonJS,
                    esModuleInterop: true
                },
                transformers: {
                    before: [appendNodeTransformer(fragmentTransformer)]
                }
            }).outputText;
            return compiled;
        }
    },
    {
        label: 'pojo comp',
        compile: async (src, _exp) => {
            const compiled = ts.transpileModule(src, {
                compilerOptions: {
                    jsx: ts.JsxEmit.React,
                    jsxFactory: 'TSXAir',
                    target: ts.ScriptTarget.ES2020,
                    esModuleInterop: true
                },
                transformers: {
                    before: [appendNodeTransformer(tsxAirTransformer)]
                }
            }).outputText;
            return compiled;
        }
    }
]; 