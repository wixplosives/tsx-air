import { shouldCompileExamples } from '@tsx-air/testing';
import compiler from '..';

describe('02', () => {
    shouldCompileExamples(compiler, ['02.stateful']);
});