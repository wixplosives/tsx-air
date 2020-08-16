import { FactoryWrapper } from './index.source';

export const runExample = (target: HTMLElement) => {
    FactoryWrapper.render({ lastName: 'Moskovich' }, target, 'append');
};

export { FactoryWrapper as Component };