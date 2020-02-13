import { packagePath } from '@tsx-air/utils/packages';
import { safely, isArrayOf } from '@tsx-air/utils';
import { ExampleSuite } from '@tsx-air/types';
import { join } from 'path';
import { isSet, isFunction } from 'lodash';

export function loadSuite(example: string): ExampleSuite {
    const examplePath = packagePath('@tsx-air/examples', 'src', 'examples', example);
    const suitePath = join(examplePath, 'suite');

    const suite = safely(
        () => require(suitePath),
        `Error loading "${suitePath}.ts"`,
        (loaded: any) => isFunction(loaded.suite) && isArrayOf(loaded.features, isSet)
    ) as ExampleSuite;

    return {
        ...suite,
        path: examplePath
    };
}