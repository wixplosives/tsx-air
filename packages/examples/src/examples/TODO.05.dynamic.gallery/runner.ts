import { render } from '@tsx-air/framework';
import { Gallery } from './index.source';

export const runExample = (target: HTMLElement) => {
    render(Gallery, { url: '/images/pretty-boy.jpg' }, undefined, target, 'append')
};

export { Gallery as Component };