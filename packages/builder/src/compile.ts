import ts from 'typescript';
import { compilerOptions } from '@tsx-air/compiler-utils';
import { Compiler } from '@tsx-air/types';
// @ts-ignore
import { createReporter } from './reporter';
import isString from 'lodash/isString';
import * as runtime from '@tsx-air/runtime';
import { Script } from 'vm';
import { join } from 'path';

/**
 * Compiles a list of files and their imports (excluding node-modules)
 */
export function compile(fileNames: string[], compiler: Compiler, outDir: string, report?: string | boolean) {
    const program = ts.createProgram(fileNames,
        { ...compilerOptions, outDir, noEmit: !outDir, sourceMap: true });

    const emitResult = program.emit(
        undefined, undefined, undefined, undefined,
        report
            ? createReporter(fileNames, compiler, isString(report) ? report : undefined)
            : compiler.transformers
    );

    const allDiagnostics = ts
        .getPreEmitDiagnostics(program)
        .concat(emitResult.diagnostics);

    if (emitResult.emitSkipped) {
        throw new Error(`Compilation failed\n` + allDiagnostics
            .filter(d => d.category === ts.DiagnosticCategory.Error)
            .map(d => {
                if (d.file) {
                    const { line, character } = d.file.getLineAndCharacterOfPosition(d.start!);
                    const message = ts.flattenDiagnosticMessageText(d.messageText, '\n');
                    return `${d.file.fileName} (${line + 1},${character + 1}): ${message}`;
                } else {
                    return ts.flattenDiagnosticMessageText(d.messageText, '\n');
                }
            })
        );
    }
    return allDiagnostics;
}

export function compileAndEval(content: string, compiler: Compiler, importPath: string = '', executionContext = {}) {
    const $rawJs = ts.transpileModule(content, {
        compilerOptions: {
            ...compilerOptions,
            module: ts.ModuleKind.CommonJS
        },
        transformers: compiler.transformers,
        fileName: 'compiled.jsx'
    }).outputText;

    const exports = { $rawJs };
    const _require = (path: string) => {
        switch (path) {
            case '@tsx-air/runtime':
                return runtime;
            default:
                return require(join(importPath, path));
        }
    };
    try {
        const script = new Script($rawJs);
        const context = { ...runtime, require: _require, exports, ...executionContext };
        script.runInNewContext(context);
        return exports as Record<string, any>;
    } catch(e) {
        e.$rawJs = $rawJs;
        throw e;
    }
}