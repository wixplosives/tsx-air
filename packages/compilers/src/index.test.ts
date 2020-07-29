import { expect } from 'chai';
import { transformerCompilers } from '.';
import { packagePath } from '@tsx-air/utils/packages';
import { readFileSync } from 'fs';
import ts from 'typescript';
import { compilerOptions } from '@tsx-air/compiler-utils';
import { Script } from 'vm';
import * as runtime from '@tsx-air/runtime';
import { browserifyFiles } from '@tsx-air/testing';
import { testRuntimeApi } from '@tsx-air/runtime/src/runtime/runtime.test.suite';

describe('compilers', () => {
    it('each compiler should have a unique name', () => {
        const usedNames: Set<string> = new Set();
        for (const { label } of transformerCompilers) {
            expect(usedNames, `${label} is not unique`).not.to.include(label);
            usedNames.add(label);
            expect(label.trim()).not.to.eql('');
        }
    });

    for (const compiler of transformerCompilers) {
        describe(`${compiler.label}`, () => {
            let Parent: any;
            let Child: any;
            before(async () => {
                await browserifyFiles(
                    packagePath('@tsx-air/runtime', 'fixtures'),
                    packagePath('@tsx-air/compilers', 'tmp'),
                    compiler,
                    'runtime.fixture.tsx',
                    'out.js',
                );
                const src = readFileSync(packagePath('@tsx-air/runtime', 'fixtures', 'runtime.fixture.tsx'), { encoding: 'utf8' });
                const out = ts.transpileModule(src, {
                    compilerOptions: {
                        ...compilerOptions,
                        module: ts.ModuleKind.CommonJS
                    },
                    transformers: compiler.transformers,
                    fileName: 'compiled.jsx'
                }).outputText;
               
                const exports = { Parent: null, Child: null };
                const require = () => runtime;
                const script = new Script(out);
                const context = {...runtime, require, exports, $rt:runtime.getInstance};
                script.runInNewContext(context);
                Parent = exports.Parent;
                Child = exports.Child;
            });
            testRuntimeApi(() => [Parent, Child]);
        });
    }
});
