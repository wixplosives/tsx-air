import { readFileSync } from 'fs';
import { validateCompilerWithExamples } from '@tsx-air/testing';
import { getManuallyCompiled, isSource } from './manual.compiler';


const manuallyCompiled = getManuallyCompiled(
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

validateCompilerWithExamples(manuallyCompiled);