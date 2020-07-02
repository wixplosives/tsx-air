import { shouldCompileExamples } from '@tsx-air/testing';
import { shouldBeCompiled } from '@tsx-air/examples';
import { transformerCompilers } from '.';

describe('compilers', () => {
    for (const compiler of transformerCompilers) {
        shouldCompileExamples(compiler, shouldBeCompiled);
    }
});