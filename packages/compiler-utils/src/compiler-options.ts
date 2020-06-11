import ts from 'typescript';

export const compilerOptions: ts.CompilerOptions = {
    target: ts.ScriptTarget.ESNext,
    lib: ['lib.es2017.d.ts', 'lib.dom.d.ts'],
    jsx: ts.JsxEmit.Preserve,
    esModuleInterop: true,
    importHelpers: true,
    declaration: false,
};