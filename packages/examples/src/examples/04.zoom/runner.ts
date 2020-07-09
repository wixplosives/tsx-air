import { Zoom } from './index.source';

export const runExample = (target: HTMLElement) => {
    Zoom.render({ url: '/images/bunny.jpg' }, target, 'append');
};

export { Zoom as Component };
