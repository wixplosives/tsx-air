import { transformerCompilers } from '@tsx-air/compilers';
import { ManuallyCompiled } from '@tsx-air/examples';
import { Compiler } from '@tsx-air/types';

export const manualCompiler = new ManuallyCompiled();

export const compilers: Compiler[] = [
    manualCompiler,
    ...transformerCompilers
]; 