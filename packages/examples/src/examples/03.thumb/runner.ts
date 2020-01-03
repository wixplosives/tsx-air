import { render } from '@tsx-air/framework';
import { Thumb } from './index.source';

export const runExample = (target: HTMLElement) => {
    render(target, Thumb, { url: '/images/prettyboy.jpg' });
};

export { Thumb as Component };