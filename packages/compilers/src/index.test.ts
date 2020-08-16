import { expect } from 'chai';
import { transformerCompilers } from '.';
import { packagePath } from '@tsx-air/utils/packages';
import { readFileSync } from 'fs';
import { testRuntimeApi } from '@tsx-air/runtime/src/runtime/runtime.test.suite';
import { compileAndEval } from '@tsx-air/builder';
import { buildTestFiles } from '@tsx-air/testing';

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
                buildTestFiles(
                    packagePath('@tsx-air/runtime', 'fixtures'),
                    packagePath('@tsx-air/compilers', 'tmp'),
                    compiler,
                    'runtime.fixture.tsx',
                    'out.js',
                );

                const exports = compileAndEval(
                    readFileSync(packagePath('@tsx-air/runtime', 'fixtures', 'runtime.fixture.tsx'), { encoding: 'utf8' }),
                    compiler
                );
                Parent = exports.Parent;
                Child = exports.Child;
            });
            testRuntimeApi(() => [Parent, Child]);
        });
    }
});
