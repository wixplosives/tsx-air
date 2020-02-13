type ComponentFeatureAtoms = 'component' | 'static' | 'stateless' | 'stateful';
type FrameWorkFeatureAtoms = 'imperative' | 'declarative' | 'update';
type Quantities = 'single' | 'multiple' | 'high' | 'low';
type ComponentInternalFeatures = 'store' | 'nested' | 'props' | 'ref';
type Interactions = 'event' | 'handler' | 'framerate' | 'dom' | 'when' | 'change';
type FeatureElement = ComponentFeatureAtoms | FrameWorkFeatureAtoms
    | Quantities | ComponentInternalFeatures | Interactions;

export type Feature = Set<FeatureElement>;
export type Features = Feature[];
export const feature = (...featureElements: FeatureElement[]) => new Set(featureElements) as Feature;
export const featureWith = (base: Feature, ...variations: FeatureElement[]) =>
    variations.map(v => new Set<FeatureElement>([...base, v])) as Features;
export const ALL:Features = [];
