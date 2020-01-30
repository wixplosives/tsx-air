import { asSourceFile, analyze, TsxFile } from '@tsx-air/compiler-utils';
import { Compiler } from '@tsx-air/types';
import { readFileSync } from 'fs';
import { transpileModule } from 'typescript';
import { packagePath } from '@tsx-air/utils/packages';
import { compilerOptions } from '@tsx-air/compiler-utils';
import { expect } from 'chai';

export const compileFixture = (name: string, compiler: Compiler) => {
    return transpileModule(
        readFixture(name),
        {
            transformers: compiler.transformers,
            compilerOptions,
            fileName: fixture(name)
        }).outputText;
};

export const fixture = (name: string) => packagePath('@tsx-air/compilers', 'fixtures', name);

export const readFixture = (name: string) => readFileSync(fixture(name), 'utf8');

export const itShouldCompileFixture = (name: string, compiler:Compiler) => {
    it(`should compile ${name} with ${compiler.label}`, () => {
        const compiled = compileFixture(`${name}.tsx`, compiler);
        expect(compiled).to.have.contentOf(fixture(`${name}.js`));
    });
};

export const parseFixture = (name: string) => asSourceFile(readFixture(name), fixture(name));
export const analyzeFixtureComponents = (name: string) =>
 (analyze(parseFixture(name)).tsxAir as TsxFile).compDefinitions;