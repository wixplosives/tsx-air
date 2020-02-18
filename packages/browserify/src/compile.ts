import ts from 'typescript';
import { compilerOptions } from '@tsx-air/compiler-utils';
import { Compiler } from '@tsx-air/types';
import { createReporter } from './reporter';

export function compile(fileNames: string[], compiler: Compiler, outDir: string) {
    const program = ts.createProgram(fileNames,
        { ...compilerOptions, outDir, noEmit: !outDir, sourceMap: true });


    const emitResult = program.emit(
        undefined, undefined, undefined, undefined,
        compiler.transformers
        // createReporter(fileNames, compiler)
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
