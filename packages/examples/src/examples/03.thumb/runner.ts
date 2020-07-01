import { Thumb } from './index.source';

export const runExample = (target: HTMLElement) => {
    Thumb.render({ url: '/images/pretty-boy.jpg' }, undefined, target, 'append')
};

export { Thumb as Component };