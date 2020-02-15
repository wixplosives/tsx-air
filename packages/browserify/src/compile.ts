import * as ts from 'typescript';
import { compilerOptions } from '@tsx-air/compiler-utils';
import { Compiler } from '@tsx-air/types';

// TODO replace ith Compiler
export function compile(fileNames: string[], transformers: ts.CustomTransformers, outDir: string) {
    const program = ts.createProgram(fileNames, { ...compilerOptions, outDir, sourceMap: true });
    const emitResult = program.emit(
        undefined, undefined, undefined, undefined, transformers
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
                    return ts.flattenDiagnosticMessageText(d.messageText, '\n')
                }
            })
        );
    }
    return allDiagnostics;
}