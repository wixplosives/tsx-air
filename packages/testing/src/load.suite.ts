import { ExampleSuite } from '@tsx-air/types';
import { join, dirname } from 'path';

export function loadSuite(example: string): ExampleSuite {
    const examplePath =
        // join(exampleSrcPath, example);
        join(dirname(require.resolve('@tsx-air/examples/package.json')), 'src', 'examples', example);
    const suitePath = join(examplePath, 'suite');


    const suite = safeDo(
        () => require(suitePath).default,
        `Error running "${suitePath}.ts"`);

    return {
        suite,
        path: examplePath
    };
}

function safeDo<T>(fn: () => T, errorMessage: string): T {
    try {
        return fn();
    } catch (err) {
        const newErr = new Error(errorMessage);
        newErr.stack = err.stack;
        throw newErr;
    }
}