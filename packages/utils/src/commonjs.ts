import ts from 'typescript';

export const toCommonJs = (source: string) => ts.transpileModule(source, {
    compilerOptions: {
        jsx: ts.JsxEmit.Preserve,
        jsxFactory: 'TSXAir',
        target: ts.ScriptTarget.ES2020,
        module: ts.ModuleKind.CommonJS,
        esModuleInterop: true
    }
}).outputText;