import { Gallery } from './index.source';

export const runExample = (target: HTMLElement) => {
    Gallery.render({ url: '/images/pretty-boy.jpg' }, undefined, target, 'append')
};

export { Gallery as Component };