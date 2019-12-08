import ts from 'typescript';

export * from './analyzers';
export * from './transformers/generators/ast-generators';
export * from './transformers/generators/to-string-generator';
export * from './transformers/generators/component-common';
export * from './transformers/generators/transformer-api-provider';
export * from './dev-utils/print-ast';
export * from './analyzers/types';
export * from './transformers/helpers';
export * from './astUtils/scanner';
export * from './visitors/jsx';
export * from './astUtils/marker';
export * from './astUtils/parser';



export const toCommonJs = (source: string) => ts.transpileModule(source, {
    compilerOptions: {
        jsx: ts.JsxEmit.Preserve,
        jsxFactory: 'TSXAir',
        target: ts.ScriptTarget.ES2020,
        module: ts.ModuleKind.CommonJS,
        esModuleInterop: true
    }
}).outputText;