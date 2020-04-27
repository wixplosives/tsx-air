import { compileFixture, fixture } from '../test.helpers';
import compiler from '.';
import { expect, use } from 'chai';
import { chaiPlugin } from '@tsx-air/testing';
use(chaiPlugin);

describe('c-AST based compiler', () => {
    [
        // 'by.example/static',
        // 'by.example/stateless',
        // 'by.example/stateful',
        // 'by.example/stateless.nested',
        'by.example/functions',
        // 'by.example/event.handler'
    ].forEach(
        name => {
            it(`should compile ${name} with "${compiler.label}.tsx" => "${compiler.label}.js"`, () => {
                const compiled = compileFixture(`${name}.tsx`, compiler);
                expect(compiled).to.have.contentOf(fixture(`${name}.js`));
            });
        });
});