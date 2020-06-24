import { render } from '@tsx-air/framework';
import { Mousy } from './index.source';

export const runExample = (target: HTMLElement) => {
    render(Mousy, { url: '/images/pretty-boy.jpg' }, undefined, target, 'append')
};

export { Mousy as Component };