import { packagePath } from '@tsx-air/utils/packages';
import { safely } from '@tsx-air/utils';
import { ExampleSuite } from '@tsx-air/types';
import { join } from 'path';

export function loadSuite(example: string): ExampleSuite {
    const examplePath = packagePath('@tsx-air/examples', 'src', 'examples', example);
    const suitePath = join(examplePath, 'suite');

    const suite = safely(
        () => require(suitePath).default,
        `Error running "${suitePath}.ts"`);

    return {
        suite,
        path: examplePath
    };
}