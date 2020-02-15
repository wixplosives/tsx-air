import * as ts from 'typescript';
import { compilerOptions } from '@tsx-air/compiler-utils/src';
import { astBasedCompiler } from '@tsx-air/compilers/src';

function compile(fileNames: string[]): void {
    const program = ts.createProgram(fileNames, {...compilerOptions, outDir:'./out'});
    const emitResult = program.emit(
        undefined, undefined, undefined, undefined, astBasedCompiler.transformers
    );

    const allDiagnostics = ts
        .getPreEmitDiagnostics(program)
        .concat(emitResult.diagnostics);

    allDiagnostics.forEach(diagnostic => {
        if (diagnostic.file) {
            const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start!);
            const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
            console.log(`${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`);
        } else {
            console.log(ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'));
        }
    });

    const exitCode = emitResult.emitSkipped ? 1 : 0;
    console.log(`Process exiting with code '${exitCode}'.`);
    process.exit(exitCode);
}

compile(process.argv.slice(2));