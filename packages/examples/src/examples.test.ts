import { validateCompilerWithExamples, useManuallyCompiledForSources } from '@tsx-air/testing';

validateCompilerWithExamples(
    {
        label: 'manually compiled examples',
        transformers: {
            before: [useManuallyCompiledForSources]
        }
    }
);