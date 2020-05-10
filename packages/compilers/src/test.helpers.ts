import { asSourceFile, analyze, TsxFile, CompDefinition } from '@tsx-air/compiler-utils';
import { Compiler } from '@tsx-air/types';
import { readFileSync } from 'fs';
import { transpileModule } from 'typescript';
import { packagePath } from '@tsx-air/utils/packages';
import { compilerOptions } from '@tsx-air/compiler-utils';

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

export const parseFixture = (name: string) =>
    asSourceFile(readFixture(name), fixture(name));

const cache: Record<string, CompDefinition[]> = {};
export const analyzeFixtureComponents = (name: string) => {
    cache[name] = cache[name] || (analyze(parseFixture(name)).tsxAir as TsxFile).compDefinitions;
    return cache[name];
};

export const basicPatterns = () => {
    const comps = analyzeFixtureComponents(`basic.patterns.tsx`);
    return {
        Static: comps[0],
        PropsOnly: comps[1],
        StateOnly: comps[2],
        ProsAndState: comps[3],
        NestedStateless: comps[4],
        EventListener: comps[5],
        DynamicAttributes: comps[6],
        DynamicAttributesSelfClosing: comps[7],
        WithVolatile: comps[8],
    };
};

export const functions = () => {
    const comps = analyzeFixtureComponents(`functions.tsx`);
    return {
        WithStateChangeOnly: comps[0],
        WithNonStateChangingCode: comps[1],
        WithVolatileVars: comps[2],
        WithVolatileFunction: comps[3],
        ValidFunctionUse: comps[4],
        InvalidFunctionUse: comps[5],
    };
};

export const conditional = () => {
    const comps = analyzeFixtureComponents(`conditional.tsx`);
    return {
        Const: comps[0],
        ShallowConditional: comps[1],
    };
};