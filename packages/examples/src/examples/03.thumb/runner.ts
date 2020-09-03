import { Thumb } from './index.source';

export const runExample = (target: HTMLElement) => {
    Thumb.render({ imageId: 'pretty-boy', resolution:'high' }, target, 'append');
};

export { Thumb as Component };