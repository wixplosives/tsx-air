import { transformerCompilers, Compiler } from '@tsx-air/compilers';
import { ManuallyCompiled } from '@tsx-air/examples';

export const manualCompiler = new ManuallyCompiled();

export const compilers: Compiler[] = [
    manualCompiler,
    ...transformerCompilers
]; 