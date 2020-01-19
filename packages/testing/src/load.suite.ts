import ts from 'typescript';
import { readFileSync } from 'fs';
import { ExampleSuite } from '@tsx-air/types';
import { join } from 'path';
import { expect } from 'chai';
import { exampleSrcPath } from '@tsx-air/examples';
import { safely } from '@tsx-air/utils';

export function loadSuite(example: string): ExampleSuite {
    const examplePath = join(exampleSrcPath, example);
    const suitePath = join(examplePath, 'suite');
    const content = safely(
        () => readFileSync(`${suitePath}.ts`, { encoding: 'utf8' }),
        `Invalid example path: did not find "${suitePath}.ts"`);
    const moduleAsJs = safely(
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

    const suite = safely(() => {
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