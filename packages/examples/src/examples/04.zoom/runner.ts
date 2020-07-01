import { Zoom } from './index.source';

export const runExample = (target: HTMLElement) => {
    Zoom.render({ url: '/images/bunny.jpg' }, undefined, target, 'append')
};

export { Zoom as Component };
