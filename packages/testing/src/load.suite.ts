import { safely } from '@tsx-air/utils';
import { ExampleSuite } from '@tsx-air/types';
import { join, dirname } from 'path';

export function loadSuite(example: string): ExampleSuite {
    const examplePath =
        // join(exampleSrcPath, example);
        join(dirname(require.resolve('@tsx-air/examples/package.json')), 'src', 'examples', example);
    const suitePath = join(examplePath, 'suite');


    const suite = safely(
        () => require(suitePath).default,
        `Error running "${suitePath}.ts"`);

    return {
        suite,
        path: examplePath
    };
}