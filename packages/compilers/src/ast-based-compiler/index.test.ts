import { itShouldCompileFixture } from '../test.helpers';
import compiler from '.';

describe.only('c-AST based compiler', () => {
    ['static', 'stateless', 'stateful'].forEach(
        name => itShouldCompileFixture(name, compiler));
});