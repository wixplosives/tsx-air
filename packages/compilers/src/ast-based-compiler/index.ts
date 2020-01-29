import { transformerApiProvider as transformerApiProvider } from '@tsx-air/compiler-utils';
import { Compiler } from '@tsx-air/types';
import { componentTransformer } from './transformer';

const compiler: Compiler = {
    label: 'AST Based compiler',
    transformers: {
        before: [transformerApiProvider(componentTransformer)]
    }
};

export default compiler;