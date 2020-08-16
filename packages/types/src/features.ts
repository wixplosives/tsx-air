type ComponentFeatureAtoms = 'component' | 'static' | 'stateless' | 'stateful';
type FrameWorkFeatureAtoms = 'imperative' | 'declarative' | 'update' | 'dynamic';
type Quantities = 'single' | 'multiple' | 'high' | 'low';
type ComponentInternalFeatures = 'store' | 'nested' | 'props' | 'ref';
type Interactions = 'lambda' | 'event' | 'handler' | 'framerate'  | 'when' | 'change';
type ViewElements = 'conditional' | 'dom' | 'children';
type FeatureElement = ComponentFeatureAtoms | FrameWorkFeatureAtoms
    | Quantities | ComponentInternalFeatures | Interactions | ViewElements;

export type Feature = Set<FeatureElement>;
export type Features = Feature[];
export const feature = (...featureElements: FeatureElement[]) => new Set(featureElements) as Feature;
export const featureWith = (base: Feature, ...variations: FeatureElement[]) =>
    variations.map(v => new Set<FeatureElement>([...base, v])) as Features;
export const ALL: Features = [];
