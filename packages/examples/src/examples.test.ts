import { readFileSync } from 'fs';
import { validateCompilerWithExamples } from '@tsx-air/testing';
import { getManuallyCompiled, isSource } from './manual.compiler';


const manuallyCompiled = getManuallyCompiled(
    src =>  isSource(src) ? 
        readFileSync(src, {encoding:'utf8'})
    : undefined;
    
)
validateCompilerWithExamples(manuallyCompiled);