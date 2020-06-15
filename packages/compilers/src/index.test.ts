import { expect } from "chai";
import { transformerCompilers } from ".";
import { testRuntimeApi } from "@tsx-air/framework/src/runtime/runtime.test.suite";
import { packagePath } from "@tsx-air/utils/packages";
import { readFileSync } from "fs";
import ts from "typescript";
import { compilerOptions } from "@tsx-air/compiler-utils";
import { Script } from "vm";
import * as fr from '@tsx-air/framework'
import { browserifyFiles } from "@tsx-air/testing";
import { fileDetails } from "packages/browserify/src/reporter.helpers";

describe.only('compilers', () => {
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
            let Parent: any, Child: any;
            before(async () => {
                await browserifyFiles(
                    packagePath('@tsx-air/framework', 'fixtures'),
                    packagePath('@tsx-air/compilers', 'tmp'), 
                    compiler,
                    'runtime.fixture.tsx',
                    'out.js',
                )
                const src = readFileSync(packagePath('@tsx-air/compilers', 'tmp', 'src.js', 'runtime.fixture.jsx'), { encoding: 'utf8' });
                // const src = readFileSync(packagePath('@tsx-air/compilers', 'tmp', 'out.js'), { encoding: 'utf8' });
                // const out = src;
                // const src = readFileSync(packagePath('@tsx-air/framework', 'fixtures', 'runtime.fixture.tsx'), { encoding: 'utf8' });
                // console.log(src);
                const out = ts.transpileModule(src, {
                    compilerOptions: {
                        ...compilerOptions,
                        module: ts.ModuleKind.CommonJS
                    },
                    transformers: compiler.transformers,
                    fileName: 'compiled.mjs'
                }).outputText;
                console.log(out);
                const script = new Script(out);
                try {
                    const exports = {};
                    const require = () => fr;
                    const t = script.runInNewContext({ exports, require }, { filename: 'compiled.mjs', });
                    // console.log(t)
                    Parent = exports.Parent;
                    Child = exports.Child;
                } catch (e) {
                    console.log(e);
                }
            });
            testRuntimeApi(() => [Parent, Child]);
        });
    }
});