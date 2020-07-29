import { Gallery } from './index.source';

export const runExample = (target: HTMLElement) => {
    Gallery.render({ baseUrl: 'images' }, target, 'append');
};

export { Gallery as Component };