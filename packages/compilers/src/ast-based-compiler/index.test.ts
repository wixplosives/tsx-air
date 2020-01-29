import { expect } from 'chai';
import { readFileSync } from 'fs';
import { packagePath } from '@tsx-air/utils/packages';
import { transpileModule } from 'typescript';
import compiler from '.';
import { compilerOptions } from '@tsx-air/compiler-utils';

const compileFixture = (name: string) => {
    const content = readFileSync(fixture(name), 'utf8');
    return transpileModule(content, {
        transformers: compiler.transformers,
        compilerOptions,
        fileName: packagePath('@tsx-air/compilers', 'fixtures', name)
    }).outputText;
};

const fixture = (name: string) => packagePath('@tsx-air/compilers', 'fixtures', name);
const itShouldCompileFixture = (name: string) => {
    it(`should compile ${name}`, () => {
        const compiled = compileFixture(`${name}.tsx`);
        expect(compiled).to.have.contentOf(fixture(`${name}.js`));
    });
};

describe('c-AST based compiler', () => {
    ['static', 'stateless', 'stateful'].forEach(itShouldCompileFixture);
});