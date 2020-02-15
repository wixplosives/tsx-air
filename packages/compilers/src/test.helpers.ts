import { asSourceFile, analyze, TsxFile, CompDefinition } from '@tsx-air/compiler-utils';
import { Compiler } from '@tsx-air/types';
import { readFileSync } from 'fs';
import { transpileModule } from 'typescript';
import { packagePath } from '@tsx-air/utils/packages';
import { compilerOptions } from '@tsx-air/compiler-utils';
import { expect, use } from 'chai';
import { plugin } from '@tsx-air/testing';
use(plugin);

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

export const itShouldCompileFixture = (name: string, compiler: Compiler) => {
    it(`should compile ${name} with "${compiler.label}.tsx" => "${compiler.label}.js"`, () => {
        const compiled = compileFixture(`${name}.tsx`, compiler);
        expect(compiled).to.have.contentOf(fixture(`${name}.js`));
    });
};

export const parseFixture = (name: string) =>
    asSourceFile(readFixture(name), fixture(name));

export const analyzeFixtureComponents = (name: string) =>
    (analyze(parseFixture(name)).tsxAir as TsxFile).compDefinitions;

let cache: CompDefinition[];
export const basicPatterns = () => {
    cache = cache || analyzeFixtureComponents(`basic.patterns.tsx`);
    return {
        Static: cache[0],
        PropsOnly: cache[1],
        StateOnly: cache[2],
        ProsAndState: cache[3],
        NestedStateless: cache[4],
        EventListener: cache[5],
        DynamicAttributes: cache[6],
        DynamicAttributesSelfClosing: cache[7],
    };
};