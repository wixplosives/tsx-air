import { render } from '@tsx-air/framework';
import { Zoom } from './index.source';

export const runExample = (target: HTMLElement) => {
    render(Zoom, { url: '/images/bunny.jpg' }, undefined, target, 'append')
};

export { Zoom as Component };
