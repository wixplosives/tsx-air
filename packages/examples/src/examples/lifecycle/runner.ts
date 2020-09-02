import { Clock } from './index.source';

export const runExample = (element: HTMLElement) => {
    Clock.render({ title: `The time is:` }, element, 'append');
};

export { Clock as Component };