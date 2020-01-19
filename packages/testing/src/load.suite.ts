import ts from 'typescript';
import { readFileSync } from 'fs';
import { ExampleSuite } from '@tsx-air/types';
import { join, dirname } from 'path';
import { expect } from 'chai';
// import { exampleSrcPath } from '@tsx-air/examples';

export function loadSuite(example: string): ExampleSuite {
    const examplePath =
        // join(exampleSrcPath, example);
        join(dirname(require.resolve('@tsx-air/examples/package.json')), 'src', 'examples', example);
    const suitePath = join(examplePath, 'suite');
    const content = safeDo(
        () => readFileSync(`${suitePath}.ts`, { encoding: 'utf8' }),
        `Invalid example path: did not find "${suitePath}.ts"`);
    const moduleAsJs = safeDo(
        () => ts.transpileModule(content, {
            fileName: `${suitePath}.ts`,
            compilerOptions: {
                module: ts.ModuleKind.CommonJS,
                moduleResolution: ts.ModuleResolutionKind.NodeJs,
                esModuleInterop: true,
                lib: ['node']
            }
        }).outputText,
        `Error transpiling "${suitePath}.ts"`);

    const suite = safeDo(() => {
        // tslint:disable-next-line: no-eval
        const evl = eval(`(exports, require)=>{${moduleAsJs}; return exports;}`);
        const s = evl({}, require).default;
        expect(s).to.be.a('function', 'Example suite file did noe export a default test suite function');
        return s;
    }, `Error evaluating "${suitePath}"`);

    return {
        suite,
        path: examplePath
    };
}

function safeDo<T>(fn: () => T, errorMessage: string): T {
    try {
        return fn();
    } catch (err) {
        const newErr = new Error(errorMessage);
        newErr.stack = err.stack;
        throw newErr;
    }
}