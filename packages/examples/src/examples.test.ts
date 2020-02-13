import { safely } from '@tsx-air/utils';
import { shouldCompileExamples } from '@tsx-air/testing';
import { shouldBeCompiled } from '.';
import { readFileSync } from 'fs';
import { isSource, ManuallyCompiled } from './manual.compiler';

const manuallyCompiled = new ManuallyCompiled(
    src => safely(() => isSource.test(src) ?
        readFileSync(src.replace(isSource, '.compiled.ts'), { encoding: 'utf8' })
        : undefined,
        `Error reading manually compiled version of ${src}`
    )
);

shouldCompileExamples(manuallyCompiled, shouldBeCompiled);