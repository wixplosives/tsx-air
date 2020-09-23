import { transformerApiProvider as transformerApiProvider } from '@tsx-air/compiler-utils';
import { Compiler, feature, featureWith } from '@tsx-air/types';
import { componentTransformer, hookTransformer, tsxAirValidator } from './transformer';

const compiler: Compiler = {
    label: 'AST Based compiler',
    transformers: {
        before: transformerApiProvider([componentTransformer, hookTransformer]),
        after: [tsxAirValidator]
    },
    features: [
        ...featureWith(feature('component'), 'static', 'stateless', 'stateful'),
        feature('declarative', 'update', 'nested', 'component'),
        feature('imperative', 'update', 'component'),
        feature('single', 'store'),
        feature('nested', 'stateless', 'component'),
        feature('event', 'handler'),
        feature('lambda', 'handler'),
        feature('conditional', 'dom'),
        feature('when', 'props', 'change', 'handler'),
        feature('dom', 'ref'),
        feature('hook'),
        feature('high', 'framerate'),
        feature('dynamic', 'children'),
        feature('lifeCycle', 'api', 'afterMount', 'afterDomUpdate'),
        feature('memo'),
    ]
};

export default compiler;