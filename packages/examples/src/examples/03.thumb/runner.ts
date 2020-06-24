import { render } from '@tsx-air/framework';
import { Thumb } from './index.source';

export const runExample = (target: HTMLElement) => {
    render(Thumb, { url: '/images/pretty-boy.jpg' }, undefined, target, 'append')
};

export { Thumb as Component };