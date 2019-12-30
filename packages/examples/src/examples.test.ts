import { validateCompilerWithExamples } from './testing';
import { useManuallyCompiledForSources } from './testing/utils';

validateCompilerWithExamples(
    {
        label: 'manually compiled examples',
        transformers: {
            before: [useManuallyCompiledForSources]
        }
    }
);