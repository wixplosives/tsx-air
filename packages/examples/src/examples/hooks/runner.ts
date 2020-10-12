import { GooglyEyes } from './index.source';

export const runExample = (target: HTMLElement) => {
    GooglyEyes.render({}, target, 'append');
};

export { GooglyEyes as Component };