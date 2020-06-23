import ts from 'typescript';

export const compilerOptions: ts.CompilerOptions = {
    target: ts.ScriptTarget.Latest,
    lib: ['lib.es2017.d.ts', 'lib.dom.d.ts'],
    jsx: ts.JsxEmit.Preserve,
    esModuleInterop: true,
    importHelpers: false,
    module: ts.ModuleKind.ESNext
    // declaration: false,
};