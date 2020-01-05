import { shouldCompileExamples } from '@tsx-air/testing';
import { shouldBeCompiled, manuallyCompiledOnly } from './examples/index';
import { readFileSync } from 'fs';
import { isSource, ManuallyCompiled } from './manual.compiler';

const manuallyCompiled = new ManuallyCompiled(
    src => {
        try {
            return isSource.test(src) ?
                readFileSync(src.replace(isSource, '.compiled.ts'), { encoding: 'utf8' })
                : undefined;
        } catch (e) {
            throw new Error(`Error reading manually compiled of ${src}: ` + e);
        }
    }
);

shouldCompileExamples(manuallyCompiled, [...shouldBeCompiled, ...manuallyCompiledOnly]);