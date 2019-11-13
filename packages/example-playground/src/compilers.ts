import { Compiler } from './types';
import { transformers } from '@wixc3/tsx-air-compiler';
import ts from 'typescript';
export const compilers: Compiler[] = [
    {
        label: 'Manual + TS',
        compile: (_src, exp) => {
            const compiled = ts.transpileModule(exp, {
                compilerOptions: {
                    jsx: ts.JsxEmit.Preserve,
                    jsxFactory: 'TSXAir',
                    target: ts.ScriptTarget.ES2020,
                    module: ts.ModuleKind.CommonJS,
                    esModuleInterop: true
                }
            }).outputText;
            return {
                printVer: compiled,
                runVer: compiled
            };
        }
    },
    {
        label: 'Compiler 1',
        compile: (src, _exp) => {
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
            console.log(preCompiled);
            const compiled = ts.transpileModule(preCompiled, {
                compilerOptions: {
                    jsx: ts.JsxEmit.Preserve,
                    jsxFactory: 'TSXAir',
                    target: ts.ScriptTarget.ES2020,
                    module: ts.ModuleKind.CommonJS,
                    esModuleInterop: true
                }
            }).outputText;
            return {
                printVer: compiled,
                runVer: compiled
            };
        }
    }
]; 