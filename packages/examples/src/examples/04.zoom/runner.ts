import { render } from '@tsx-air/framework';
import { Zoom } from './index.source';

export const runExample = (target: HTMLElement) => {
    render(target, Zoom, { url: '/images/bunny.jpg' });
};

export { Zoom as Component };
