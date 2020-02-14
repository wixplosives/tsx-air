import { transformerApiProvider as transformerApiProvider } from '@tsx-air/compiler-utils';
import { Compiler, feature, featureWith } from '@tsx-air/types';
import { componentTransformer } from './transformer';

const compiler: Compiler = {
    label: 'AST Based compiler',
    transformers: {
        before: [transformerApiProvider(componentTransformer)]
    },
    features: [
        ...featureWith(feature('component'), 'static', 'stateless', 'stateful'),
        feature('declarative', 'update', 'nested', 'component'),
        feature('imperative', 'update', 'component'),
        feature('single', 'store'),
        feature('nested', 'stateless', 'component'),
        feature('event', 'handler'),
    ]
};

export default compiler;